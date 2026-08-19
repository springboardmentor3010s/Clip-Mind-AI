import React from 'react';
import { render, screen } from '@testing-library/react';
import { KeywordTags } from '../src/components/video/KeywordTags';

describe('KeywordTags', () => {
  it('renders nothing when there are no keywords', () => {
    const { container } = render(<KeywordTags keywords={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip for every keyword', () => {
    render(<KeywordTags keywords={['empowerment', 'authority', 'permission']} />);

    expect(screen.getByText('empowerment')).toBeInTheDocument();
    expect(screen.getByText('authority')).toBeInTheDocument();
    expect(screen.getByText('permission')).toBeInTheDocument();
  });
});
