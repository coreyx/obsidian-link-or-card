export interface Strings {
  menuCard: string;
  menuLink: string;
  menuPlain: string;
  toCard: string;
  toLink: string;
  toPlain: string;
  fetching: string;
  noTitle: string;
  cardWithoutMeta: string;
  urlMoved: string;
  noLinkAtCursor: string;
  commandChangeStyle: string;
  commandPasteAndChoose: string;
  clipboardUnreadable: string;
  invalidCard: string;
  settingPasteStyleName: string;
  settingPasteStyleDesc: string;
  pasteStyleAsk: string;
  settingIgnoredUrlsName: string;
  settingIgnoredUrlsDesc: string;
  settingPreserveSelectionName: string;
  settingPreserveSelectionDesc: string;
}

const en: Strings = {
  menuCard: "Card",
  menuLink: "Link",
  menuPlain: "Plain URL",
  toCard: "Convert to card",
  toLink: "Convert to link",
  toPlain: "Convert to plain URL",
  fetching: "Fetching the page…",
  noTitle: "Couldn't get the page title, so the URL was left as it is.",
  cardWithoutMeta: "Couldn't fetch the page, so the card shows the URL only.",
  urlMoved: "The URL was edited while the page was loading, so nothing was changed.",
  noLinkAtCursor: "There is no link at the cursor.",
  commandChangeStyle: "Change link style at cursor",
  commandPasteAndChoose: "Paste URL and choose style",
  clipboardUnreadable: "Couldn't read the clipboard.",
  invalidCard: 'This link card has no valid "url".',
  settingPasteStyleName: "When pasting a URL",
  settingPasteStyleDesc:
    'What a pasted URL turns into. Plain URL leaves the paste alone. To choose for a single paste, use the command "Paste URL and choose style" (Ctrl/Cmd+Shift+V unless you change it under Hotkeys).',
  pasteStyleAsk: "Ask with a menu",
  settingIgnoredUrlsName: "Ignore these URLs",
  settingIgnoredUrlsDesc:
    "One per line. A domain such as example.com also covers its subdomains; add a path, as in github.com/my-org, to cover only part of a site. Pasting a matching URL leaves it as it is.",
  settingPreserveSelectionName: "Preserve selection as title",
  settingPreserveSelectionDesc: "Whether to prefer selected text as title over fetched title when pasting.",
};

const ja: Strings = {
  menuCard: "カード",
  menuLink: "リンク",
  menuPlain: "URLのまま",
  toCard: "カードにする",
  toLink: "リンクにする",
  toPlain: "URLに戻す",
  fetching: "ページ情報を取得しています…",
  noTitle: "ページのタイトルを取得できなかったので、URLのままにしました。",
  cardWithoutMeta: "ページ情報を取得できなかったので、URLだけのカードにしました。",
  urlMoved: "取得中にURLが編集されたので、変換を取りやめました。",
  noLinkAtCursor: "カーソル位置にリンクがありません。",
  commandChangeStyle: "カーソル位置のリンクの表示形式を変える",
  commandPasteAndChoose: "URLを貼り付けて形式を選ぶ",
  clipboardUnreadable: "クリップボードを読み取れませんでした。",
  invalidCard: "このリンクカードには有効な url がありません。",
  settingPasteStyleName: "URLを貼り付けたとき",
  settingPasteStyleDesc:
    "貼り付けたURLをどの形式にするかを選びます。「URLのまま」は通常の貼り付けです。貼り付けるたびに選びたいときは、コマンド「URLを貼り付けて形式を選ぶ」を使います（ホットキーを変えていなければ Ctrl/Cmd+Shift+V）。",
  pasteStyleAsk: "メニューで選ぶ",
  settingIgnoredUrlsName: "変換しないURL",
  settingIgnoredUrlsDesc:
    "1行に1つ入力します。example.com のようなドメインはサブドメインも対象になり、github.com/my-org のようにパスを付けるとサイトの一部だけが対象になります。一致するURLは貼り付けてもそのままになります。",
  settingPreserveSelectionName: "選択したテキストをタイトルにする",
  settingPreserveSelectionDesc: "貼り付けるとき、取得したタイトルよりも選択中のテキストを優先してタイトルにします。",
};

export function getStrings(locale: string): Strings {
  return locale.toLowerCase().startsWith("ja") ? ja : en;
}
