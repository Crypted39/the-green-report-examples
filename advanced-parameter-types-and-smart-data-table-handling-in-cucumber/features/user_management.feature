Feature: User Management with Custom Parameter Types

  Scenario: Creating users with different roles
    Given a user with email john@example.com and role admin
    And a user with email jane@example.com and role user
    When I login as john@example.com
    Then the user should have admin privileges
    And the user should be able to "manage_users"

  Scenario: User with custom name
    Given a moderator user named "Jane Doe" with email jane.doe@company.com
    When I login as jane.doe@company.com
    Then the user should have moderator privileges
    And the user should be able to "moderate"

  Scenario: Money handling
    Given I have $150.50 in my account
    Then my balance should be $150.50

  Scenario: Date handling
    Given today is tomorrow
    Then the date should be a weekend