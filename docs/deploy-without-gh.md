# GitHub CLIを使わない公開手順

## 方針

`gh auth` が不安定な場合は、GitHub CLIを使わない。

まず外出先URLを作ることを優先し、公開用に作った `dist/` または `sushi-kcal-dist.zip` をブラウザからアップロードする。

## 公開用ファイル

作成済み:

```text
/Users/sakiya/Documents/Codex/sushi-kcal-dist.zip
```

このzipには公開に必要なファイルだけが入っている。

- `index.html`
- `styles.css`
- `app.js`
- `sw.js`
- `manifest.webmanifest`
- `data/menu-items.js`
- `icons/`

公式HTML、開発用ドキュメント、抽出用の元データは入っていない。

## 方法A: Netlify Drop

一番手数が少ない一時公開ルート。

1. ブラウザで `https://app.netlify.com/drop` を開く
2. `sushi-kcal-dist.zip` をアップロードする
3. 発行されたURLを iPhone Safari で開く
4. ホーム画面に追加して確認する

注意:

- 新しい外部サービスを使うため、恒久運用にするかは後で判断する。
- まず Vol.0.3 の実運用確認を進めるための迂回路として使う。

## 方法B: Cloudflare Pages Direct Upload

Cloudflareアカウントを使う場合のルート。

1. Cloudflare Dashboard で Pages を開く
2. Direct Upload を選ぶ
3. `sushi-kcal-dist.zip` または `dist/` をアップロードする
4. 発行されたURLを iPhone Safari で開く
5. ホーム画面に追加して確認する

## 方法C: GitHub Web UI

GitHub CLIを使わず、ブラウザだけで進めるルート。

1. GitHubで `sushi-kcal` リポジトリを作る
2. `dist/` の中身だけをアップロードする
3. Settings > Pages で公開元を設定する

ただし、フォルダごとのアップロードや更新がやや面倒なので、Vol.0.3の確認目的では Netlify Drop の方が速い。

## 今回のおすすめ

まず Netlify Drop で外出先URLを作る。

Vol.0.3 の実運用確認が終わったら、恒久化として GitHub Pages または Cloudflare Pages に移す。
