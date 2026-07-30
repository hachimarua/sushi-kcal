# すしkcal

スシロー・くら寿司で食べたものを外食中に素早く足し、MealTracker の QuickAdd に手入力しやすくする個人用PWAです。

## 初版スコープ

- 起動時にスシロー / くら寿司を選択
- ネタ名検索
- タップで皿に追加
- 選択回数に応じて、よく食べる商品を上位表示
- 個数変更
- 合計kcal表示
- 3D風ホーム画面アイコン
- MealTracker転記用に「名前」「kcal」「まとめ」をコピー

MealTracker 側では塩分は手入力しない前提です。必要な入力は名前とカロリーだけです。

今後の開発計画は [ROADMAP.md](ROADMAP.md) に記録しています。
iPhone 実機確認の項目は [docs/iphone-vol0.3-checklist.md](docs/iphone-vol0.3-checklist.md) にまとめています。
iPhone で開くURLの考え方は [docs/vol0.3-iphone-url.md](docs/vol0.3-iphone-url.md) にまとめています。
GitHub Pages への公開手順は [docs/deploy-github-pages.md](docs/deploy-github-pages.md) にまとめています。
GitHub CLIを使わない公開手順は [docs/deploy-without-gh.md](docs/deploy-without-gh.md) にまとめています。

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
スシローは普段使う栗東小柿店、くら寿司は全店舗・西日本・九州の商品を収録します。

```bash
curl -L -o data/sushiro.html 'https://www.akindo-sushiro.co.jp/menu/menu_detail/?s_id=449'
curl -L -o data/kura.html 'https://www.kurasushi.co.jp/menu/'
node tools/extract-menu-data.mjs
```

## よく食べる順

- 商品の追加回数は、この端末のブラウザ内にだけ保存します。
- 「リセット」は今回の皿だけを空にし、選択回数は残します。
- 使用頻度の低い商品も、検索すれば表示できます。
- Safariのサイトデータを削除すると、選択回数も消えます。

生成される `data/menu-items.js` がアプリで読み込まれる同梱データです。

## アイコン更新

ホーム画面用アイコンは `icons/icon-source.png` から Pillow で各サイズにリサイズしています。

```bash
python3 tools/generate-app-icons.py
```

生成される `icons/icon-180.png` は iOS の `apple-touch-icon`、`icons/icon-192.png` と `icons/icon-512.png` は PWA manifest で使います。
