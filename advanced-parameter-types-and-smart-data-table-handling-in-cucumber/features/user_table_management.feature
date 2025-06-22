Feature: User Management with Data Tables

  Scenario: Create multiple users
    Given the following users exist:
      | name       | email            | role      |
      | John Smith | john@example.com | admin     |
      | Jane Doe   | jane@example.com | user      |
      | Bob Wilson | bob@example.com  | moderator |
    Then I should have 3 users created
