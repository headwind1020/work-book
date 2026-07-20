'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store'

/**
 * 在客户端水合完成后手动 rehydrate zustand persist
 * 防止 SSR 阶段没有 localStorage 导致的 hydration mismatch
 */
export function StoreHydrator() {
  useEffect(() => {
    useAppStore.persist.rehydrate()
  }, [])
  return null
}