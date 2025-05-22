const linkRegex = /(?<href>\bhttps?:\/\/[^\s"'<>()]+)/gm

export const getMatchedLink = (str: string, startIndex?: number) => {
  const links: Array<{ href: string; from: number; to: number }> = []

  let match

  while ((match = linkRegex.exec(str)) !== null) {
    const href = match.groups!.href!

    links.push({
      href,
      from: (startIndex ?? 0) + match.index,
      to: (startIndex ?? 0) + match.index + href.length,
    })
  }

  return links
}
