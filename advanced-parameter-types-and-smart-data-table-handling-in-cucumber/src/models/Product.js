class Product {
  constructor({
    name,
    price,
    category,
    inStock = true,
    description = "",
    tags = [],
  }) {
    this.name = name;
    this.price = price;
    this.category = category;
    this.inStock = inStock;
    this.description = description;
    this.tags = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim());
    this.id = Math.random().toString(36).substr(2, 9);
  }

  isAvailable() {
    return this.inStock;
  }

  hasTag(tag) {
    return this.tags.includes(tag);
  }

  applyDiscount(percentage) {
    this.price.amount = this.price.amount * (1 - percentage / 100);
    this.price.cents = Math.round(this.price.amount * 100);
  }
}

module.exports = Product;
