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
  invalidCard: string;
  settingAskOnPasteName: string;
  settingAskOnPasteDesc: string;
  settingIgnoredUrlsName: string;
  settingIgnoredUrlsDesc: string;
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
  invalidCard: 'This link card has no valid "url".',
  settingAskOnPasteName: "Ask when pasting a URL",
  settingAskOnPasteDesc:
    "Show a menu to choose card, link or plain URL. When off, pasting works as usual and you can still convert with the command or the right-click menu.",
  settingIgnoredUrlsName: "Don't ask for these URLs",
  settingIgnoredUrlsDesc:
    "One per line. A domain such as example.com also covers its subdomains; add a path, as in github.com/my-org, to cover only part of a site. Matching URLs are pasted as usual, without the menu.",
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
  invalidCard: "このリンクカードには有効な url がありません。",
  settingAskOnPasteName: "URLを貼り付けたときに形式を選ぶ",
  settingAskOnPasteDesc:
    "カード・リンク・URLのままから選ぶメニューを出します。オフにすると通常の貼り付けになり、コマンドか右クリックメニューで後から変換できます。",
  settingIgnoredUrlsName: "メニューを出さないURL",
  settingIgnoredUrlsDesc:
    "1行に1つ入力します。example.com のようなドメインはサブドメインも対象になり、github.com/my-org のようにパスを付けるとサイトの一部だけが対象になります。一致するURLはメニューを出さずに通常どおり貼り付けます。",
};

export function getStrings(locale: string): Strings {
  return locale.toLowerCase().startsWith("ja") ? ja : en;
}
