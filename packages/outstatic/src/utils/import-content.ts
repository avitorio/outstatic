import type { ContentSuggestion, InferredField } from '@/types/content-scan'
import type { CollectionType } from '@/utils/hooks/use-collections'
import type { SingletonType } from '@/types/singleton'
import { findCollectionParent } from '@/utils/collections/collection-tree'
import { createFieldSchemaDocument } from '@/utils/hooks/field-schema'

export type ImportFile = { path: string; content: string }

export function fieldsToSchemaProperties(fields: InferredField[]) {
  return Object.fromEntries(
    fields.map(({ name, title, fieldType, dataType, required, itemType }) => [
      name,
      {
        title,
        fieldType,
        dataType,
        required,
        ...(itemType ? { itemType } : {})
      }
    ])
  )
}

export function composeImportFiles({
  selections,
  singletons,
  existingCollections,
  existingSingletons,
  ostContent
}: {
  selections: ContentSuggestion[]
  singletons: ContentSuggestion[]
  existingCollections: CollectionType[]
  existingSingletons: SingletonType[]
  ostContent: string
}): { files: ImportFile[]; skipped: string[] } {
  const collections = [...existingCollections]
  const singletonEntries = [...existingSingletons]
  const files: ImportFile[] = []
  const skipped: string[] = []

  for (const suggestion of selections) {
    if (
      collections.some(
        (collection) =>
          collection.slug === suggestion.slug ||
          collection.path === suggestion.path
      )
    ) {
      skipped.push(suggestion.path)
      continue
    }
    const collection = {
      title: suggestion.title,
      slug: suggestion.slug,
      path: suggestion.path,
      parent: findCollectionParent(collections, suggestion.path)
    }
    collections.push(collection)
    files.push({
      path: `${ostContent}/${suggestion.slug}/schema.json`,
      content: createFieldSchemaDocument(
        { kind: 'collection', slug: suggestion.slug, title: suggestion.title },
        fieldsToSchemaProperties(suggestion.fields) as any
      )
    })
  }

  for (const suggestion of singletons) {
    if (
      singletonEntries.some(
        (singleton) =>
          singleton.slug === suggestion.slug ||
          singleton.path === suggestion.sampleFiles[0]
      )
    ) {
      skipped.push(suggestion.path)
      continue
    }
    const path = suggestion.sampleFiles[0]
    if (!path) {
      skipped.push(suggestion.path)
      continue
    }
    singletonEntries.push({
      title: suggestion.title,
      slug: suggestion.slug,
      path,
      directory: path.split('/').slice(0, -1).join('/'),
      publishedAt: new Date(0).toISOString(),
      status: 'draft'
    })
    files.push({
      path: `${ostContent}/_singletons/${suggestion.slug}.schema.json`,
      content: createFieldSchemaDocument(
        { kind: 'singleton', slug: suggestion.slug, title: suggestion.title },
        fieldsToSchemaProperties(suggestion.fields) as any
      )
    })
  }

  files.push({
    path: `${ostContent}/collections.json`,
    content: JSON.stringify(collections, null, 2) + '\n'
  })
  files.push({
    path: `${ostContent}/singletons.json`,
    content: JSON.stringify(singletonEntries, null, 2) + '\n'
  })
  return { files, skipped }
}
