import { OutstaticData } from '@/app'
import { OUTSTATIC_API_PATH } from '../constants'

const mockProviderProps = {
  repoOwner: 'anything',
  repoSlug: 'anything',
  repoBranch: 'anything',
  contentPath: 'anything',
  monorepoPath: 'anything',
  ostPath: 'outstatic',
  session: {
    user: {
      name: 'Test User',
      login: 'testuser',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      permissions: [
        'roles.manage',
        'settings.manage',
        'members.manage',
        'invites.manage',
        'collections.manage',
        'content.manage',
        'projects.manage'
      ]
    },
    access_token: 'mock-access-token',
    expires: new Date(Date.now() + 3600000)
  },
  initialApolloState: null,
  collections: ['collection1', 'collection2', 'collection3'],
  pages: [],
  hasAIProviderKey: false,
  hasChanges: false,
  setHasChanges: () => {},
  basePath: '',
  missingEnvVars: { required: {}, optional: {} },
  ostDetach: false,
  ostContent: 'anything',
  dashboardRoute: '/outstatic',
  githubGql: 'https://api.github.com/graphql',
  csrfToken: null,
  publicMediaPath: 'anything',
  repoMediaPath: 'anything',
  isPro: false
} as OutstaticData

export default mockProviderProps
