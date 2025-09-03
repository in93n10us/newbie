/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset auth state before each test
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', () => {
      cy.visit('/')
      cy.get('[data-testid="login-button"]').click()
      
      // Auth0 login form
      cy.origin(Cypress.env('auth0_domain'), () => {
        cy.get('input[name="email"]').type(Cypress.env('auth0_username'))
        cy.get('input[name="password"]').type(Cypress.env('auth0_password'))
        cy.get('button[type="submit"]').click()
      })

      // Verify successful login
      cy.url().should('eq', Cypress.config().baseUrl + '/dashboard')
      cy.get('[data-testid="user-profile"]').should('be.visible')
    })

    it('should show error message with invalid credentials', () => {
      cy.visit('/')
      cy.get('[data-testid="login-button"]').click()

      cy.origin(Cypress.env('auth0_domain'), () => {
        cy.get('input[name="email"]').type('invalid@email.com')
        cy.get('input[name="password"]').type('wrongpassword')
        cy.get('button[type="submit"]').click()
        
        cy.get('.auth0-error-message')
          .should('be.visible')
          .and('contain', 'Wrong email or password')
      })
    })

    it('should handle social login providers', () => {
      cy.visit('/')
      cy.get('[data-testid="login-button"]').click()

      cy.origin(Cypress.env('auth0_domain'), () => {
        cy.get('[data-provider="google"]').should('be.visible')
        cy.get('[data-provider="github"]').should('be.visible')
      })
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/api/auth/login')
    })

    it('should allow access to protected routes when authenticated', () => {
      cy.login() // Custom command that handles auth
      cy.visit('/dashboard')
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Logout Flow', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should successfully log out', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="logout-button"]').click()
      
      // Verify logout
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[data-testid="login-button"]').should('be.visible')
    })

    it('should clear auth tokens after logout', () => {
      cy.visit('/dashboard')
      cy.get('[data-testid="logout-button"]').click()
      
      cy.getAllLocalStorage().should((storage) => {
        expect(storage).to.not.have.property('auth0Tokens')
      })
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page reloads', () => {
      cy.login()
      cy.visit('/dashboard')
      cy.reload()
      cy.get('[data-testid="user-profile"]').should('be.visible')
    })

    it('should handle session timeout', () => {
      cy.clock()
      cy.login()
      cy.visit('/dashboard')
      
      // Advance time past token expiry
      cy.tick(24 * 60 * 60 * 1000)
      cy.reload()
      
      cy.url().should('include', '/api/auth/login')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during login', () => {
      cy.intercept('POST', '**/oauth/token', {
        forceNetworkError: true
      }).as('loginRequest')

      cy.visit('/')
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Network error occurred')
    })

    it('should handle Auth0 service unavailability', () => {
      cy.intercept('GET', '**/authorize*', {
        statusCode: 503,
        body: 'Service Unavailable'
      }).as('authRequest')

      cy.visit('/')
      cy.get('[data-testid="login-button"]').click()
      
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .and('contain', 'Authentication service unavailable')
    })
  })
})

// Custom commands
Cypress.Commands.add('login', () => {
  cy.session('auth0', () => {
    cy.visit('/')
    cy.get('[data-testid="login-button"]').click()
    
    cy.origin(Cypress.env('auth0_domain'), () => {
      cy.get('input[name="email"]').type(Cypress.env('auth0_username'))
      cy.get('input[name="password"]').type(Cypress.env('auth0_password'))
      cy.get('button[type="submit"]').click()
    })
    
    cy.url().should('include', '/dashboard')
  })
})