# すしkcal

スシロー・くら寿司で食べたものを外食中に素早く足し、MealTracker の QuickAdd に手入力しやすくする個人用PWAです。

## 初版スコープ

- 起動時にスシロー / くら寿司を選択
- ネタ名検索
- タップで皿に追加
- 個数変更
- 合計kcal表示
- 3D風ホーム画面アイコン
- MealTracker転記用に「名前」「kcal」「まとめ」をコピー

MealTracker 側では塩分は手入力しない前提です。必要な入力は名前とカロリーだけです。

今後の開発計画は [ROADMAP.md](ROADMAP.md) に記録しています。
iPhone 実機確認の項目は [docs/iphone-vol0.3-checklist.md](docs/iphone-vol0.3-checklist.md) にまとめています。
iPhone で開くURLの考え方は [docs/vol0.3-iphone-url.md](docs/vol0.3-iphone-url.md) にまとめています。
GitHub Pages への公開手順は [docs/deploy-github-pages.md](docs/deploy-github-pages.md) にまとめています。

## ローカル確認

```bash
npm run check
npm run build
```

ローカルサーバーで見る場合:

```bash
npm run serve
```

## データ採用ルール

- 同じ店舗・同じ商品名が複数ある場合は1件に統合します。
- 代表行は価格欄があるものを優先します。
- `100mlあたり` のような単位付きカロリーは残しますが、画面上で注意表示します。

## データ更新

公式メニューHTMLを取得してから抽出スクリプトを実行します。

```bash
curl -L -o data/sushiro.html 'https://www.akindo-sushiro.co.jp/menu/menu_detail/?s_id=1'
curl -L -o data/kura.html 'https://www.kurasushi.co.jp/menu/'
node tools/extract-menu-data.mjs
```

生成される `data/menu-items.js` がアプリで読み込まれる同梱データです。

## アイコン更新

ホーム画面用アイコンは Pillow で生成しています。

```bash
python3 tools/generate-app-icons.py
```

生成される `icons/icon-180.png` は iOS の `apple-touch-icon`、`icons/icon-192.png` と `icons/icon-512.png` は PWA manifest で使います。
