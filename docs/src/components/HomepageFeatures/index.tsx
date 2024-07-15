import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

type FeatureItem = {
  title: string;
  // Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  imgUr: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    // Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    imgUr: "img/easy.png",
    description: (
      <>
        React Native Filament is a React Native library that makes it easy to render 3D graphics in your app, by using react components.
      </>
    ),
  },
  {
    title: 'Native GPU accelerated rendering',
    imgUr: "img/gpu.png",
    description: (
      <>
        Filament taps directly into your mobiles GPU by using Metal on iOS or OpenGL or Vulkan on Android.
      </>
    ),
  },
  {
    title: 'Made for mobile',
    imgUr: "img/mobile.png",
    description: (
      <>
        Filament, the library behind React Native Filament, was build for mobile first.
        Its native dependency adds only ~4MB to your app download size.
      </>
    ),
  },
];

function Feature({title, imgUr, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        {/* <Svg className={styles.featureSvg} role="img" /> */}
        <img src={useBaseUrl(imgUr)} className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
