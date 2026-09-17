# 進捗の定時更新（board.json）

ダッシュボードの進捗は `board.json` だけで決まる。定時タスクはこのファイルだけを書き換える。
`app.js`（タスクの文言・構造）は定時タスクでは触らない。

## board.json の形

```json
{
  "updatedAt": "2026-09-17T20:00:00+09:00",
  "updatedBy": "定時更新",
  "note": "9/18 MTGの決定を反映",
  "tasks": [{ "id": "t19", "title": "（参照用）", "status": "doing", "owner": "高野部長・浜西", "due": "9月中" }]
}
```

- status：backlog / todo / doing / review / done
- due：「9月中」「10月上旬」の形式（省略可。省略時は app.js の値）
- title：人と定時タスクが読むための参照用。画面には使われない

## 定時タスクのプロンプト（例：平日18:00）

```
DCプロジェクトのダッシュボードの進捗を更新する。

入力
1. G:\マイドライブ\ai-ops 内の「DC進捗メモ.md」と、DCの議事録ファイルのうち、前回実行以降に更新されたもの
2. ローカルにクローンした DCProject リポジトリの board.json

手順
1. git pull する
2. 入力から、board.json の各タスクについて status / owner / due の変更を読み取る
3. 根拠が明確なものだけ board.json を書き換える。updatedAt は現在時刻、updatedBy は「定時更新」、note は変更の要約（1行）
4. 変更がなければ何もせず終了する
5. 変更があれば commit して push する。コミットメッセージに「T19: doing→review（根拠：9/18議事録）」の形で全変更を列挙する

守ること
- 書き換えるのは board.json だけ。app.js、index.html は触らない
- 根拠が曖昧なもの、タスク一覧にない新しい作業は書き換えず、「DC進捗メモ.md」の末尾の「要確認」に追記する
- done への変更は、完了と明記されている場合に限る
- 金額、個社名、個人名（担当者欄を除く）は board.json に書かない
```
