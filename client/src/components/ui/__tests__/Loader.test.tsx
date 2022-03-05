import React from 'react';
import { render } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
  it('does not render if isLoading is false', () => {
    const { container } = render(<Loader color="blue" isLoading={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders with proper styles', () => {
    const { container } = render(<Loader color="blue" isLoading />);

    const overlay = container.firstChild;
    expect(overlay).toHaveClass('overlay');

    const loader = overlay?.firstChild;
    expect(loader).toHaveClass('ldsEllipsis');

    const dots = loader?.childNodes;
    expect(dots).toHaveLength(4);

    dots?.forEach((node) => {
      expect(node).toHaveClass('bg-blue');
    });
  });

  it('renders proper styles for custom width', () => {
    const width = 15;
    const { container } = render(
      <Loader color="blue" isLoading width={width} />
    );

    const loader = container.getElementsByClassName('ldsEllipsis')[0];

    expect(loader).toHaveStyle({
      width: `${width}px`,
    });

    const computedStyles = window.getComputedStyle(loader);
    const computedHeight = computedStyles
      .getPropertyValue('height')
      .split('px')[0];
    const computedWidth = computedStyles
      .getPropertyValue('width')
      .split('px')[0];

    expect(parseFloat(computedHeight)).toBeCloseTo((width * 3) / 7, 5);
    expect(parseFloat(computedWidth)).toBeCloseTo(width, 5);
  });
});
