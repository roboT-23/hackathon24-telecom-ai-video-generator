import './tailwind.css';
import React, { useEffect, useState } from 'react';
import { Composition, Sequence } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { ChartView } from './ChartView';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const RemotionRoot: React.FC = () => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the pending render job and associated scenes
  useEffect(() => {
    const fetchPendingJobAndScenes = async () => {
      try {
        const jobResponse = await axios.get(`${API_BASE_URL}/render-queue/pending`);
        const wizardId = jobResponse.data.renderJob.wizard_id;

        console.log(`[INFO] Found pending render job for wizard_id: ${wizardId}`);

        // Fetch scenes for the wizard
        const scenesResponse = await axios.get(`${API_BASE_URL}/scenes/${wizardId}`);
        setScenes(scenesResponse.data.scenes || []);
        console.log(`[INFO] Scenes loaded:`, scenesResponse.data.scenes);
      } catch (error) {
        console.error('Error fetching pending render job or scenes:', error);
        setError('Failed to load scenes or render job.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingJobAndScenes();
  }, []);

  if (loading) {
    return <div>Loading scenes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Calculate total duration dynamically
  const totalDuration = scenes.reduce(
    (acc, scene) => acc + (scene.data?.duration || 150), // Default to 150 if duration is missing
    0
  );

  return (
    <>
      <Composition
        id="MainComposition"
        component={() => (
          <>
            {scenes.map((scene, index) => {
              const startFrame = scenes
                .slice(0, index)
                .reduce((acc, s) => acc + (s.data?.duration || 150), 0); // Calculate start frame dynamically

              if (scene.type === 'intro') {
                return (
                  <Sequence key={index} from={startFrame} durationInFrames={scene.data?.duration || 150}>
                    <HelloWorld
                      titleText={scene.data?.text || 'Weather report'}
                      titleColor="#000000"
                    />
                  </Sequence>
                );
              }

              if (scene.type === 'chart' && scene.data?.chart) {
                return (
                  <Sequence key={index} from={startFrame} durationInFrames={scene.data?.duration || 300}>
                    <ChartView
                      chartDataKey={scene.data.chart.key}
                      title={scene.data.chart.title}
                      categories={scene.data.chart.categories || []}
                      summary={scene.data.summary || {}}
                    />
                  </Sequence>
                );
              }

              console.warn(`Unknown scene type: ${scene.type}`);
              return null;
            })}
          </>
        )}
        durationInFrames={totalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
