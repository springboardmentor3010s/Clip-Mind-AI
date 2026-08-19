import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoPlayer } from '../src/components/video/VideoPlayer';

// jsdom doesn't implement real media playback or layout.
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
    configurable: true,
    get: () => 100,
  });
});

describe('VideoPlayer', () => {
  const keyMoments = [
    { id: 1, video_id: 1, start_time: 0, end_time: 20, title: 'Intro', description: '' },
    { id: 2, video_id: 1, start_time: 50, end_time: 70, title: 'Main Topic', description: '' },
  ];

  it('renders no markers when there are no key moments', () => {
    render(<VideoPlayer url="https://example.com/video.mp4" />);
    expect(screen.queryByTitle('Intro')).not.toBeInTheDocument();
  });

  it('renders a marker per key moment once video metadata has loaded', () => {
    const { container } = render(
      <VideoPlayer url="https://example.com/video.mp4" keyMoments={keyMoments} />
    );

    const video = container.querySelector('video')!;
    fireEvent.loadedMetadata(video);

    expect(screen.getByTitle('Intro')).toBeInTheDocument();
    expect(screen.getByTitle('Main Topic')).toBeInTheDocument();
  });

  it('seeks the video when a marker is clicked', () => {
    const { container } = render(
      <VideoPlayer url="https://example.com/video.mp4" keyMoments={keyMoments} />
    );

    const video = container.querySelector('video') as HTMLVideoElement;
    fireEvent.loadedMetadata(video);

    fireEvent.click(screen.getByTitle('Main Topic'));
    expect(video.currentTime).toBe(50);
  });
});
