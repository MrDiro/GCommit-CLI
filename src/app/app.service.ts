import { cyan, blue, yellow, red, green, bold } from 'chalk';
import { Injectable } from "modilitejs";
import { textSync } from "figlet";
import fileSize from 'file-size';
import { statSync } from 'fs';
import boxen from 'boxen';

@Injectable()
export class AppService {
  private readonly title = 'Gcommit - CLI';

  constructor() {}

  public getDisplay() {
    const banner = textSync(this.title);
    const box = boxen(cyan(banner), {
      padding: 1.3,
      borderStyle: 'double',
      borderColor: 'yellowBright'
    });

    return box;
  }

  public getPrefix(prefix: string) {
    let result = green(prefix);

    if (/(m|r)/gi.test(prefix)) {
      result = blue(prefix);
    }
    else if (/(\?\?|u|t|c)/gi.test(prefix)) {
      result = yellow(prefix);
    }
    else if (/d/gi.test(prefix)) {
      result = red(prefix);
    }

    return result;
  }

  public getFileSize(prefix: string, filename:string) {
    let size = bold('0 Bytes');

    if (!/d/gi.test(prefix)) {
      size = bold(fileSize(statSync(filename).size).human());
    }

    return size;
  }

  public getVersion(type: string) {
    let version = '';

    if (/break/gi.test(type)) {
      version = 'major';
    }
    else if (/feat/gi.test(type)) {
      version = 'minor';
    }
    else {
      version = 'patch';
    }

    return version;
  }
}
