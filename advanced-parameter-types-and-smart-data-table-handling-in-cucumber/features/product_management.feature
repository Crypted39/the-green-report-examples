Feature: Product Management with Data Tables

  Background:
    Given the following products exist:
      | name        | price   | category    | in_stock | tags           |
      | iPhone 15   | $999.99 | electronics | true     | phone,premium  |
      | MacBook Pro | $2499   | computers   | true     | laptop,premium |
      | iPad Air    | $599    | electronics | false    | tablet         |
      | Magic Mouse | $79     | accessories | true     | mouse,wireless |

  Scenario: Search products by category
    When I search for products in category "electronics"
    Then I should find 2 products

  Scenario: Search products by tag
    When I search for products with tag "premium"
    Then I should find 2 products

  Scenario: Create product with vertical table
    Given a product with these details:
      | name        | Premium Widget     |
      | price       | $29.99             |
      | category    | gadgets            |
      | description | A fantastic gadget |
      | tags        | premium,new,useful |
    Then the product should have the name "Premium Widget"
    And the product should have 3 tags

  Scenario: Validate product details
    Then the products should have the following details:
      | name        | price   | category    | in_stock |
      | iPhone 15   | $999.99 | electronics | true     |
      | MacBook Pro | $2499   | computers   | true     |
