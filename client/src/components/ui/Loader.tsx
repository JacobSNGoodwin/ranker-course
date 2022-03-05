import React from 'react';
import classes from './Loader.module.css';

type LoaderProps = {
  color: 'blue' | 'orange' | 'purple';
  isLoading: boolean;
  width?: number;
};

const colorStyles = {
  blue: 'bg-blue',
  orange: 'bg-orange',
  purple: 'bg-purple',
};

const Loader: React.FC<LoaderProps> = ({ color, isLoading, width = 80 }) => {
  const colorStyle = colorStyles[color] || 'bg-purple';

  const d = width / 7;

  const left1 = d;
  const left2 = 3 * d;
  const left3 = 5 * d;

  const dotStyles = { width: d, height: d, top: d };

  return isLoading ? (
    <div className={classes.overlay}>
      <div className={classes.ldsEllipsis} style={{ height: 3 * d, width }}>
        <div className={colorStyle} style={{ ...dotStyles, left: left1 }}></div>
        <div className={colorStyle} style={{ ...dotStyles, left: left1 }}></div>
        <div className={colorStyle} style={{ ...dotStyles, left: left2 }}></div>
        <div className={colorStyle} style={{ ...dotStyles, left: left3 }}></div>
      </div>
    </div>
  ) : null;
};

export default Loader;
