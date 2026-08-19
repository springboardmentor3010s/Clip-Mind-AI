import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryViewer } from '../src/components/video/SummaryViewer';

describe('SummaryViewer', () => {
  const mockSummary = {
    id: 1,
    video_id: 1,
    short_summary: 'Short text',
    detailed_summary: 'Detailed text',
  };

  it('renders correctly with no summary', () => {
    const handleGenerate = jest.fn();
    render(<SummaryViewer summary={null} isLoading={false} onGenerateSummary={handleGenerate} />);

    expect(screen.getByText('No Summary Available')).toBeInTheDocument();
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const handleGenerate = jest.fn();
    render(<SummaryViewer summary={null} isLoading={true} onGenerateSummary={handleGenerate} />);

    expect(screen.getByText('Generating AI summary... This may take a few moments.')).toBeInTheDocument();
  });

  it('disables the generate button while the video is still processing', () => {
    const handleGenerate = jest.fn();
    render(<SummaryViewer summary={null} isLoading={false} onGenerateSummary={handleGenerate} disabled />);

    expect(screen.getByText('Processing video…')).toBeDisabled();
  });

  it('toggles between short and detailed summary', () => {
    const handleGenerate = jest.fn();
    render(<SummaryViewer summary={mockSummary} isLoading={false} onGenerateSummary={handleGenerate} />);

    // Default is short summary
    expect(screen.getByText('Short text')).toBeInTheDocument();

    // Click detailed
    fireEvent.click(screen.getByText('Detailed Notes'));
    expect(screen.getByText('Detailed text')).toBeInTheDocument();
  });

  it('calls onGenerateSummary when clicked', () => {
    const handleGenerate = jest.fn();
    render(<SummaryViewer summary={null} isLoading={false} onGenerateSummary={handleGenerate} />);

    fireEvent.click(screen.getByText('Generate Summary'));
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });
});
