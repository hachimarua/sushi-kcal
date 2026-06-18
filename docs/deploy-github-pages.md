# GitHub Pages デプロイ手順

## 目的

`すしkcal` を外出先の iPhone から HTTPS で開けるようにする。

## 方針

開発用ファイル全体ではなく、`dist/` に組み立てた静的アプリだけを GitHub Pages に公開する。

公開対象:

- `index.html`
- `styles.css`
- `app.js`
- `sw.js`
- `manifest.webmanifest`
- `data/menu-items.js`
- `icons/`

公開しないもの:

- 公式サイトから取得した元HTML
- `data/menu-items.json`
- README や開発ドキュメント

## ローカル確認

```bash
npm run check
npm run build
```

`dist/` が作られれば準備完了。

## 初回公開

GitHub CLI の認証が切れている場合は、先に再ログインする。

```bash
gh auth login -h github.com
```

その後、リポジトリを作って push する。

```bash
git init
git add .
git commit -m "Initial sushi kcal PWA"
gh repo create sushi-kcal --public --source=. --remote=origin --push
```

GitHub のリポジトリ設定で Pages の Source を `GitHub Actions` にする。

その後、`main` に push すると `.github/workflows/pages.yml` が `dist/` を公開する。

## 公開範囲の注意

GitHub Free で GitHub Pages を使う場合、基本的には公開リポジトリで運用する。

GitHub Pages のサイトは、リポジトリが private であっても外部からアクセスできる公開サイトとして扱う。個人情報や非公開メモは公開対象に含めない。

このアプリでは `dist/` のみを Pages に公開する。公開リポジトリに置く前提のため、公式HTMLと `data/menu-items.json` は `.gitignore` でコミット対象から外す。

## 公開後の確認

- iPhone Safari で公開URLを開く
- ホーム画面に追加する
- 表示名が「すしkcal」になる
- アイコンがまぐろ・たまご・ガリになる
- スシロー / くら寿司を選び、検索とコピーが動く

## 更新時

デザインやデータを更新したら、Service Worker の `cacheName` を上げる。

```js
const cacheName = 'sushi-kcal-v12';
```

その後:

```bash
npm run check
npm run build
git add .
git commit -m "Update sushi kcal"
git push
```
