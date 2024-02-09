const mockProviderProps = {
  repoOwner: 'anything',
  repoSlug: 'anything',
  repoBranch: 'anything',
  contentPath: 'anything',
  monorepoPath: 'anything',
  session: null,
  initialApolloState: null,
  collections: ['collection1', 'collection2', 'collection3'],
  pages: [],
  addPage: (page: string) => {},
  removePage: (page: string) => {},
  hasOpenAIKey: false,
  hasChanges: false,
  setHasChanges: () => {}
}

export default mockProviderProps
