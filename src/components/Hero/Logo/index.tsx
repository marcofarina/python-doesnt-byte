import React from 'react';
import LogoSVG from '@site/static/img/logo.svg';

type LogoProps = {
  width?: string;
  height?: string;
};

const Logo: React.FC<LogoProps> = ({ width = '250px', height = '250px' }) => {
  return <LogoSVG width={width} height={height} />;
};

export default Logo;
