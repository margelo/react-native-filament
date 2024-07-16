import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import styles from './index.module.css';

import useBaseUrl from '@docusaurus/useBaseUrl';

function HomepageHeader() {
  return (
    <header>
        <iframe src={useBaseUrl('demos/helmet.html')} style={{
          width: '100%',
          height: '40vh',
          zIndex: -1
        }} />

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/guides">
            Getting started - 5min ⏱️
          </Link>
        </div>

    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
