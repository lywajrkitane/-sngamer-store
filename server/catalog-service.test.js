const assert = require("assert");
const { fetchCatalog } = require("./catalog-service");

async function run() {
  const calls = [];
  const fakeDb = async (query) => {
    calls.push(query);
    return {
      rows: [{
        id: 1,
        name: "Test product",
        category: "Univers Gaming",
        platform: "Gaming Phone",
        product_condition: "Neuf",
        warranty: "Aucune garantie",
        warranty_configured: false,
        price: 1000,
        stock: 2,
        emoji: "🎮",
        description: "Test",
        characteristics: [],
        colors: [],
        image1_url: null,
        image2_url: null,
        image3_url: null,
        video_url: null,
        promo_price: null,
        promo_active: false,
        campaign_id: null,
        campaign_name: null,
        campaign_sticker: null,
        campaign_right_sticker: null,
        campaign_active: null,
        created_at: new Date().toISOString()
      }]
    };
  };

  const rows = await fetchCatalog(fakeDb);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].name, "Test product");
  assert.ok(calls[0].includes("LEFT JOIN campaigns"));
  assert.ok(calls[0].includes("p.promo_price"));
  assert.ok(calls[0].includes("p.colors"));

  console.log("catalog-service smoke test: OK");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
