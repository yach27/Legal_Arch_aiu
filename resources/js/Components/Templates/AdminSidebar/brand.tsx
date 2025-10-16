import ccisLogo from "./logo.png";
import climbsLogo from "./logo.png";
import climbsLogo2 from "./logo.png";
import crystal_connect from "./logo.png";

import { FC } from "react";

export interface IBrandProps {
    width: number;
    height: number;
    type?: number;
}

const Brand: FC<IBrandProps> = ({ width = 100, height = 100, type = 2 }) => {
    return (
        <>
            {type === 1 && (
                <img
                    src={climbsLogo}
                    width={width}
                    height={height}
                    alt="CCIS logo"
                />
            )}
            {type === 2 && (
                <img
                    src={ccisLogo}
                    width={width}
                    height={height}
                    alt="Climbs logo"
                />
            )}
            {type === 3 && (
                <img
                    src={climbsLogo2}
                    width={width}
                    height={height}
                    alt="Climbs logo"
                />
            )}
            {type === 4 && (
                <img
                    src={crystal_connect}
                    width={width}
                    height={height}
                    alt="Climbs logo"
                />
            )}
        </>
    );
};

export default Brand;
