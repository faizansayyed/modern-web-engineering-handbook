const products = [
  { id: 1, name: "Laptop", category: "electronics", price: 800, inStock: true, tags: ["work", "computer"] },
  { id: 2, name: "Phone", category: "electronics", price: 500, inStock: true, tags: ["mobile"] },
  { id: 3, name: "Shoes", category: "fashion", price: 120, inStock: false, tags: ["sports"] },
  { id: 4, name: "Watch", category: "fashion", price: 200, inStock: true, tags: ["luxury"] },
  { id: 5, name: "Headphones", category: "electronics", price: 100, inStock: false, tags: ["music"] }
];

const cards = products.map(d => d.name)
console.log(cards)

const availableProducts = products.filter(d => d.inStock)
console.log(availableProducts)

// 3. Open Product Details
const productDetails = products.find(d => d.id === 2)
console.log(productDetails)

// 4. Find Where Product Exists
const productIdex = products.findIndex(d => d.id === 3)
console.log(productIdex)

// 5. Show Warning Banner
const hasOutOfStock = products.some(d => !d.inStock)
console.log(hasOutOfStock)


