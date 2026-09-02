import type { AppConfig } from '../config.js'
import { InMemoryApplicationsRepository } from './inMemoryRepository.js'
import type { ApplicationsRepository } from './repository.js'
import {
  createSupabaseClient,
  SupabaseApplicationsRepository,
} from './supabaseRepository.js'

export function createRepository(config: AppConfig): ApplicationsRepository {
  if (config.store === 'memory' || !config.supabase) {
    return new InMemoryApplicationsRepository()
  }

  return new SupabaseApplicationsRepository(
    createSupabaseClient(config.supabase),
    config.supabase.canRead,
  )
}
