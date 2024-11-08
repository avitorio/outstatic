const mockNavigationGuard = {
  useNavigationGuard: jest.fn(),
  NavigationGuard: jest.fn().mockImplementation(({ children }) => children),
  useBlocker: jest.fn()
}

module.exports = mockNavigationGuard
