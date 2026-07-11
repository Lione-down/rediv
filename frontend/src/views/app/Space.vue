<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppTopBar from '../../components/layout/AppTopBar.vue'
import { useTemplateStore } from '../../modules/template/store'
import type { Template } from '../../modules/template/types'
import { useAssetStore } from '../../store/assets'
import { useAuthStore } from '../../store/auth'
import type { Asset } from '../../types/asset'
import SpaceAssetsPanel from './components/space/space-assets-panel.vue'
import SpaceDetailDrawer from './components/space/space-detail-drawer.vue'
import SpaceOverviewHeader from './components/space/space-overview-header.vue'
import SpaceProjectNotice from './components/space/space-project-notice.vue'
import SpaceQuotaPanel from './components/space/space-quota-panel.vue'
import SpaceTemplatesPanel from './components/space/space-templates-panel.vue'
import type {
  SpaceAssetFilter,
  SpaceDetailKind,
  SpaceTab,
} from './components/space/space-presentation'

const SPACE_ASSET_PAGE_SIZE = 12
const SPACE_VIEWS: Array<{ value: SpaceTab; label: string }> = [
  { value: 'assets', label: '资产' },
  { value: 'templates', label: '模板' },
  { value: 'quota', label: '额度' },
]
const router = useRouter()
const authStore = useAuthStore()
const assetStore = useAssetStore()
const templateStore = useTemplateStore()
const activeTab = ref<SpaceTab>('assets')
const assetType = ref<SpaceAssetFilter>('all')
const assetPage = ref(1)
const detailKind = ref<SpaceDetailKind>(null)
const isDetailOpen = ref(false)
const selectedAssetSummary = ref<Asset | null>(null)
const selectedTemplateSummary = ref<Template | null>(null)
const quotaHasLoaded = ref(Boolean(authStore.user))
const quotaIsLoading = ref(false)
const quotaError = ref('')
const projectNavigationError = ref('')
const projectNavigationIsPending = ref(false)
let assetLoadRevision = 0
let quotaLoadRevision = 0
let templateNavigationRevision = 0
const templateTotal = computed(() =>
  templateStore.hasLoaded ? templateStore.collection.total : null,
)
const assetTotal = computed(() =>
  assetStore.spaceHasLoaded ? assetStore.spaceCollection.total : null,
)
const createdProjectId = computed(
  () => templateStore.createdProject?.project_id || '',
)
const createdProjectName = computed(
  () => templateStore.createdProject?.project_name || '新项目',
)
const isRefreshing = computed(
  () =>
    assetStore.spaceIsLoading ||
    templateStore.isLoading ||
    quotaIsLoading.value,
)
const drawerAsset = computed(() =>
  detailKind.value === 'asset'
    ? assetStore.selectedAsset || selectedAssetSummary.value
    : null,
)
const drawerTemplate = computed(() =>
  detailKind.value === 'template'
    ? templateStore.selectedTemplate || selectedTemplateSummary.value
    : null,
)
const detailIsLoading = computed(() =>
  detailKind.value === 'asset'
    ? assetStore.detailIsLoading
    : detailKind.value === 'template'
      ? templateStore.detailIsLoading
      : false,
)
const detailError = computed(() =>
  detailKind.value === 'asset'
    ? assetStore.detailLoadError
    : detailKind.value === 'template'
      ? templateStore.detailLoadError
      : '',
)
const detailUseError = computed(() =>
  detailKind.value === 'template' &&
  drawerTemplate.value?.id === templateStore.useErrorTemplateId
    ? templateStore.useError
    : '',
)
function getAssetQuery() {
  return {
    ...(assetType.value === 'all' ? {} : { asset_type: assetType.value }),
    page: assetPage.value,
    page_size: SPACE_ASSET_PAGE_SIZE,
  }
}
async function loadAssetPage(force = false) {
  const revision = ++assetLoadRevision

  try {
    await assetStore.loadSpaceAssets(getAssetQuery(), force)
  } catch {
    return
  }

  if (revision !== assetLoadRevision) {
    return
  }

  const { items, total, page_size: pageSize } = assetStore.spaceCollection
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  if (items.length === 0 && assetPage.value > lastPage) {
    assetPage.value = lastPage
    await loadAssetPage(true)
  }
}

async function loadTemplates(force = false) {
  try {
    await (force ? templateStore.refreshTemplates() : templateStore.loadTemplates())
  } catch {
    // The store exposes the sanitized list error inside the active tab.
  }
}

async function loadQuota() {
  const revision = ++quotaLoadRevision
  const requestedToken = authStore.token
  if (!requestedToken) {
    return
  }

  quotaIsLoading.value = true
  quotaError.value = ''

  try {
    await authStore.loadCurrentUser()
    if (revision === quotaLoadRevision && requestedToken === authStore.token) {
      quotaHasLoaded.value = true
    }
  } catch {
    if (revision === quotaLoadRevision && requestedToken === authStore.token) {
      quotaError.value = '账户额度加载失败，请稍后重试。'
    }
  } finally {
    if (revision === quotaLoadRevision && requestedToken === authStore.token) {
      quotaIsLoading.value = false
    }
  }
}

async function loadSpaceData(force = false) {
  if (!authStore.isLoggedIn) {
    return
  }

  await Promise.all([
    loadAssetPage(force),
    loadTemplates(force),
    loadQuota(),
  ])
}

function handleAssetFilter(nextType: SpaceAssetFilter) {
  if (assetType.value === nextType) {
    return
  }

  assetType.value = nextType
  assetPage.value = 1
  void loadAssetPage()
}

function handleAssetPage(nextPage: number) {
  if (assetPage.value === nextPage) {
    return
  }

  assetPage.value = nextPage
  void loadAssetPage()
}

function selectAsset(asset: Asset) {
  templateStore.clearTemplateDetail()
  selectedTemplateSummary.value = null
  selectedAssetSummary.value = asset
  detailKind.value = 'asset'
  isDetailOpen.value = true
  void assetStore.loadAssetDetail(asset.id).catch(() => undefined)
}

function selectTemplate(template: Template) {
  assetStore.clearAssetDetail()
  selectedAssetSummary.value = null
  selectedTemplateSummary.value = template
  detailKind.value = 'template'
  isDetailOpen.value = true
  void templateStore.loadTemplateDetail(template.id).catch(() => undefined)
}

function closeDetail() {
  isDetailOpen.value = false
  detailKind.value = null
  selectedAssetSummary.value = null
  selectedTemplateSummary.value = null
  assetStore.clearAssetDetail()
  templateStore.clearTemplateDetail()
}

function retryDetail() {
  if (detailKind.value === 'asset' && selectedAssetSummary.value) {
    void assetStore.refreshAssetDetail().catch(() => undefined)
  } else if (detailKind.value === 'template' && selectedTemplateSummary.value) {
    void templateStore.refreshTemplateDetail().catch(() => undefined)
  }
}

async function openProject(projectId: string) {
  const normalizedProjectId = projectId.trim()
  if (!normalizedProjectId) {
    return
  }

  try {
    const navigationFailure = await router.push({
      name: 'workspace',
      query: { project_id: normalizedProjectId },
    })
    if (!navigationFailure) {
      closeDetail()
    }
  } catch {
    // The current view remains available when navigation cannot complete.
  }
}

async function useTemplateAndOpen(templateId: string) {
  if (createdProjectId.value) {
    projectNavigationError.value = '已有新项目等待打开，请先处理当前提示。'
    return
  }

  const navigationRevision = ++templateNavigationRevision
  try {
    const result = await templateStore.useTemplateById(templateId)
    if (!result?.project_id || navigationRevision !== templateNavigationRevision) {
      return
    }

    if (detailKind.value === 'template') {
      closeDetail()
    }
    projectNavigationError.value = ''
    await navigateToCreatedProject(navigationRevision)
  } catch {
    // Mutation failures remain in the store; navigation failures are handled separately below.
  }
}

async function navigateToCreatedProject(navigationRevision: number) {
  if (
    !createdProjectId.value ||
    navigationRevision !== templateNavigationRevision ||
    projectNavigationIsPending.value
  ) {
    return
  }

  projectNavigationIsPending.value = true
  try {
    const navigationFailure = await router.push({
      name: 'workspace',
      query: { project_id: createdProjectId.value },
    })
    if (!navigationFailure) {
      templateStore.clearCreatedProject()
      projectNavigationError.value = ''
    } else if (navigationRevision === templateNavigationRevision) {
      projectNavigationError.value = '项目已创建，但页面跳转未完成。请再次打开该项目。'
    }
  } catch {
    if (navigationRevision === templateNavigationRevision) {
      projectNavigationError.value = '项目已创建，但页面跳转失败。请再次打开该项目。'
    }
  } finally {
    if (navigationRevision === templateNavigationRevision) {
      projectNavigationIsPending.value = false
    }
  }
}

function openCreatedProject() {
  const navigationRevision = ++templateNavigationRevision
  void navigateToCreatedProject(navigationRevision)
}

function dismissCreatedProject() {
  templateNavigationRevision += 1
  templateStore.clearCreatedProject()
  projectNavigationError.value = ''
  projectNavigationIsPending.value = false
}

function resetLocalState() {
  assetLoadRevision += 1
  quotaLoadRevision += 1
  activeTab.value = 'assets'
  assetType.value = 'all'
  assetPage.value = 1
  quotaHasLoaded.value = false
  quotaIsLoading.value = false
  quotaError.value = ''
  dismissCreatedProject()
  closeDetail()
}

onBeforeUnmount(() => {
  templateNavigationRevision += 1
  assetStore.clearAssetDetail()
  templateStore.clearTemplateDetail()
})

watch(
  () => authStore.token,
  (token, previousToken) => {
    if (token !== previousToken) {
      resetLocalState()
    }
  },
  { flush: 'sync' },
)

watch(
  () => [authStore.token, authStore.user?.id] as const,
  ([token, userId], [previousToken, previousUserId]) => {
    if (token && userId && (token !== previousToken || userId !== previousUserId)) {
      quotaHasLoaded.value = true
      void loadSpaceData()
    }
  },
)

onMounted(async () => {
  if (authStore.isLoggedIn) {
    quotaHasLoaded.value = true
    await loadSpaceData()
  }
})
</script>

<template>
  <main class="space-page">
    <AppTopBar />

    <div class="space-shell">
      <SpaceOverviewHeader
        :nickname="authStore.user?.nickname || 'Creator'"
        :asset-total="assetTotal"
        :template-total="templateTotal"
        :quotas="authStore.quotas"
        :is-refreshing="isRefreshing"
        @refresh="loadSpaceData(true)"
      />

      <section class="workspace-surface" aria-label="个人空间内容">
        <SpaceProjectNotice
          v-if="createdProjectId"
          :project-name="createdProjectName"
          :navigation-error="projectNavigationError"
          :is-opening="projectNavigationIsPending"
          @open="openCreatedProject"
          @dismiss="dismissCreatedProject"
        />

        <nav class="workspace-switcher" aria-label="个人空间视图">
          <button
            v-for="view in SPACE_VIEWS"
            :id="`space-view-${view.value}`"
            :key="view.value"
            class="focus-ring"
            :class="{ 'is-active': activeTab === view.value }"
            type="button"
            :aria-pressed="activeTab === view.value"
            :aria-controls="`space-panel-${view.value}`"
            @click="activeTab = view.value"
          >
            {{ view.label }}
          </button>
        </nav>

        <div
          v-show="activeTab === 'assets'"
          id="space-panel-assets"
          class="workspace-view"
          role="region"
          aria-labelledby="space-view-assets"
        >
          <SpaceAssetsPanel
            :assets="assetStore.spaceCollection.items"
            :total="assetStore.spaceCollection.total"
            :page="assetPage"
            :page-size="SPACE_ASSET_PAGE_SIZE"
            :active-type="assetType"
            :has-loaded="assetStore.spaceHasLoaded"
            :is-loading="assetStore.spaceIsLoading"
            :error="assetStore.spaceLoadError"
            @filter="handleAssetFilter"
            @page="handleAssetPage"
            @refresh="loadAssetPage(true)"
            @select="selectAsset"
          />
        </div>

        <div
          v-show="activeTab === 'templates'"
          id="space-panel-templates"
          class="workspace-view"
          role="region"
          aria-labelledby="space-view-templates"
        >
          <SpaceTemplatesPanel
            :templates="templateStore.collection.items"
            :total="templateStore.collection.total"
            :selected-template-id="templateStore.selectedTemplateId"
            :using-template-id="templateStore.usingTemplateId"
            :has-pending-project="Boolean(createdProjectId)"
            :has-loaded="templateStore.hasLoaded"
            :is-loading="templateStore.isLoading"
            :error="templateStore.loadError"
            :use-error="templateStore.useError"
            @refresh="loadTemplates(true)"
            @select="selectTemplate"
            @use="useTemplateAndOpen($event.id)"
          />
        </div>

        <div
          v-show="activeTab === 'quota'"
          id="space-panel-quota"
          class="workspace-view"
          role="region"
          aria-labelledby="space-view-quota"
        >
          <SpaceQuotaPanel
            :quotas="authStore.quotas"
            :generation-status="authStore.user?.generation_status || 'frozen'"
            :has-loaded="quotaHasLoaded"
            :is-loading="quotaIsLoading"
            :error="quotaError"
            @refresh="loadQuota"
          />
        </div>
      </section>
    </div>

    <SpaceDetailDrawer
      :show="isDetailOpen"
      :kind="detailKind"
      :asset="drawerAsset"
      :template="drawerTemplate"
      :is-loading="detailIsLoading"
      :error="detailError"
      :using-template-id="templateStore.usingTemplateId"
      :has-pending-project="Boolean(createdProjectId)"
      :use-error="detailUseError"
      @close="closeDetail"
      @retry="retryDetail"
      @open-project="openProject"
      @use-template="useTemplateAndOpen"
    />
  </main>
</template>

<style scoped lang="scss" src="./components/space/space-page.scss"></style>
