import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#0a0c1a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FitTrack" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="description" content="FitTrack — Your personal fitness & nutrition tracker" />
        <meta property="og:title" content="FitTrack" />
        <meta property="og:description" content="Track calories, workouts, and hit your fitness goals." />
        <meta property="og:image" content="/logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
