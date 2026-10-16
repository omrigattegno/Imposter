/**
 * How to play: one screen, six illustrated steps (avatar scenes from HowToArt), the scoring box and
 * the lift gesture illustrated.
 */
import type { CSSProperties } from 'react';
import { Avatar } from '../avatars';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { BackButton } from '../components/pregame/BackButton';
import { STEP_ART } from '../components/pregame/HowToArt';
import { LiftIllustration } from '../components/pregame/LiftIllustration';
import { POINTS_IMPOSTER_GUESSES, POINTS_IMPOSTER_SURVIVES, POINTS_TABLE_WIN } from '../game/constants';
import { useT, type MessageKey } from '../i18n';
import { useNav } from '../nav';
import '../styles/pregame.css';

const STEPS: Array<{ text: MessageKey; title: MessageKey }> = [
  { text: 'howto.step1', title: 'howto.stepTitle1' },
  { text: 'howto.step2', title: 'howto.stepTitle2' },
  { text: 'howto.step3', title: 'howto.stepTitle3' },
  { text: 'howto.step4', title: 'howto.stepTitle4' },
  { text: 'howto.step5', title: 'howto.stepTitle5' },
  { text: 'howto.step6', title: 'howto.stepTitle6' },
];

export function HowToScreen() {
  const t = useT();
  const { back } = useNav();

  return (
    <main className="screen howto anim-screen-enter" data-testid="howto-screen">
      <TopBar leading={<BackButton onClick={() => back()} testId="howto-back" />} title={t('common.howToPlay')} />

      <div className="howto__intro anim-slide-up">
        <Avatar id="bolt" size={64} mood="happy" animate="bob" className="howto__host" />
        <p className="howto__introText">{t('howto.intro')}</p>
      </div>

      <ol className="howto__steps stagger">
        {STEPS.map(({ text, title }, i) => {
          const Art = STEP_ART[i];
          return (
            <li key={text} className="howto__step anim-slide-up" style={{ '--i': i + 1 } as CSSProperties}>
              <div className="howto__artBox">
                <Art />
              </div>
              <div className="howto__body">
                <h2 className="howto__stepTitle">
                  <span className="howto__num" aria-hidden="true">
                    {i + 1}
                  </span>
                  {t(title)}
                </h2>
                <p className="howto__text">{t(text)}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="howto__score anim-slide-up" aria-labelledby="howto-score">
        <h2 id="howto-score" className="howto__scoreTitle">
          {t('howto.scoringTitle')}
        </h2>
        <ul className="howto__scoreList">
          <li className="howto__scoreRow">
            <span className="howto__scoreFaces" aria-hidden="true">
              <Avatar id="bean" size={40} mood="happy" />
              <Avatar id="bubble" size={40} mood="happy" />
              <Avatar id="dot" size={40} mood="happy" />
            </span>
            <span className="howto__scoreText">{t('howto.score.table')}</span>
            <span className="howto__pts howto__pts--table">
              <b className="tabular">+{POINTS_TABLE_WIN}</b>
              <small>{t('howto.score.each')}</small>
            </span>
          </li>
          <li className="howto__scoreRow">
            <span className="howto__scoreFaces" aria-hidden="true">
              <Avatar id="echo" size={40} mood="sneaky" />
            </span>
            <span className="howto__scoreText">{t('howto.score.survive')}</span>
            <span className="howto__pts howto__pts--imposter">
              <b className="tabular">+{POINTS_IMPOSTER_SURVIVES}</b>
            </span>
          </li>
          <li className="howto__scoreRow">
            <span className="howto__scoreFaces" aria-hidden="true">
              <Avatar id="echo" size={40} mood="happy" unmasked />
            </span>
            <span className="howto__scoreText">{t('howto.score.guess')}</span>
            <span className="howto__pts howto__pts--imposter">
              <b className="tabular">+{POINTS_IMPOSTER_GUESSES}</b>
            </span>
          </li>
        </ul>
      </section>

      <section className="howto__lift anim-slide-up">
        <h2 className="howto__liftTitle">{t('howto.liftTitle')}</h2>
        <LiftIllustration title={t('howto.liftTitle')} />
        <div className="howto__captions">
          <span>{t('howto.liftFlat')}</span>
          <span>{t('howto.liftUp')}</span>
        </div>
        <p className="howto__note">{t('howto.liftNote')}</p>
      </section>

      <div className="pg-grow" />

      <Button variant="primary" size="l" block sfx="whoosh" data-testid="howto-done" onClick={() => back()}>
        {t('howto.gotIt')}
      </Button>
    </main>
  );
}
