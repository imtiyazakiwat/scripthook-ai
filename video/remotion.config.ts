import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setCrf(12);
Config.setPixelFormat('yuv420p');
if (process.env.CHROME_PATH) Config.setBrowserExecutable(process.env.CHROME_PATH);
