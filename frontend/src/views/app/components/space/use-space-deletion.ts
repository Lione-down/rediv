import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useTemplateStore } from '../../../../modules/template/store'
import type { Template } from '../../../../modules/template/types'
import { useAssetStore } from '../../../../store/assets'
import { useAuthStore } from '../../../../store/auth'
import type { Asset } from '../../../../types/asset'
import type { SpaceDetailKind } from './space-presentation'

type DeleteKind = Exclude<SpaceDetailKind, null>

interface DeleteTarget {
  kind: DeleteKind
  id: string
}

interface DeleteFailure extends DeleteTarget {
  message: string
}

interface SpaceDeletionOptions {
  assetPage: Ref<number>
  detailKind: Ref<SpaceDetailKind>
  drawerAsset: ComputedRef<Asset | null>
  drawerTemplate: ComputedRef<Template | null>
  closeDetail: () => void
  loadAssetPage: (force?: boolean) => Promise<void>
  loadTemplates: (force?: boolean) => Promise<void>
}

export type SpaceDeleteState = 'idle' | 'deleting'

function isSameTarget(
  left: DeleteTarget | null,
  right: DeleteTarget | null,
) {
  return Boolean(
    left &&
      right &&
      left.kind === right.kind &&
      left.id === right.id,
  )
}

export function useSpaceDeletion(options: SpaceDeletionOptions) {
  const authStore = useAuthStore()
  const assetStore = useAssetStore()
  const templateStore = useTemplateStore()
  const deleteFailure = ref<DeleteFailure | null>(null)
  let isUnmounted = false

  const currentTarget = computed<DeleteTarget | null>(() => {
    if (options.detailKind.value === 'asset' && options.drawerAsset.value) {
      return { kind: 'asset', id: options.drawerAsset.value.id }
    }
    if (options.detailKind.value === 'template' && options.drawerTemplate.value) {
      return { kind: 'template', id: options.drawerTemplate.value.id }
    }
    return null
  })

  const deleteState = computed<SpaceDeleteState>(() => {
    const target = currentTarget.value
    if (
      target &&
      ((target.kind === 'asset' && assetStore.deletingAssetId === target.id) ||
        (target.kind === 'template' && templateStore.deletingTemplateId === target.id))
    ) {
      return 'deleting'
    }
    return 'idle'
  })

  const deleteError = computed(() =>
    isSameTarget(deleteFailure.value, currentTarget.value)
      ? deleteFailure.value?.message || ''
      : '',
  )

  function closeDetailIfCurrent(target: DeleteTarget) {
    if (!isUnmounted && isSameTarget(currentTarget.value, target)) {
      options.closeDetail()
    }
  }

  async function correctAssetPageBoundary() {
    const { total, page_size: pageSize } = assetStore.spaceCollection
    const lastPage = Math.max(1, Math.ceil(total / pageSize))
    if (options.assetPage.value > lastPage) {
      options.assetPage.value = lastPage
      await options.loadAssetPage(true)
    }
  }

  async function executeDeletion(target: DeleteTarget) {
    deleteFailure.value = null
    try {
      if (target.kind === 'asset') {
        const deletedAsset = await assetStore.deleteAssetById(target.id)
        if (!deletedAsset || isUnmounted) {
          return
        }
        closeDetailIfCurrent(target)
        await correctAssetPageBoundary()
        return
      }

      const wasDeleted = await templateStore.deleteTemplateById(target.id)
      if (!wasDeleted || isUnmounted) {
        return
      }
      closeDetailIfCurrent(target)
      await options.loadTemplates(true)
    } catch {
      if (isUnmounted) {
        return
      }
      deleteFailure.value = {
        ...target,
        message:
          target.kind === 'asset'
            ? assetStore.deleteError || '资产删除失败，请稍后重试。'
            : templateStore.deleteError || '模板删除失败，请稍后重试。',
      }
    }
  }

  function deleteDetail(kind: DeleteKind, id: string) {
    const target = { kind, id: id.trim() }
    if (
      !target.id ||
      !isSameTarget(target, currentTarget.value) ||
      deleteState.value !== 'idle'
    ) {
      return Promise.resolve()
    }
    return executeDeletion(target)
  }

  watch(
    () => authStore.token,
    () => {
      deleteFailure.value = null
    },
    { flush: 'sync' },
  )

  onBeforeUnmount(() => {
    isUnmounted = true
    deleteFailure.value = null
  })

  return {
    deleteState,
    deleteError,
    deleteDetail,
  }
}
