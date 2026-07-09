export interface PresetImageEntity {
  id: string
  slug: string
  name: string
  url: string
  sortOrder: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface PresetImagesRepository {
  list(): Promise<readonly PresetImageEntity[]>
  create(input: {
    slug: string
    name: string
    url: string
    sortOrder?: number
    createdBy?: string | null
  }): Promise<PresetImageEntity>
  update(
    id: string,
    patch: Partial<{
      slug: string
      name: string
      url: string
      sortOrder: number
    }>,
  ): Promise<PresetImageEntity>
  delete(id: string): Promise<void>
}
