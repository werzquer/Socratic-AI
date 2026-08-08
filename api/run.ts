import vm from 'vm';
import { execSync } from 'child_process';

function runPythonInJS(code: string): { success: boolean; isError?: boolean; output: string } {
  let output = "";
  try {
    let jsCode = code
      .replace(/print\((.*?)\)/g, 'console.log($1)')
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/def\s+([a-zA-Z_]\w*)\s*\((.*?)\)\s*:/g, 'function $1($2) {')
      .replace(/range\((\d+)\)/g, 'Array.from({length: $1}, (_, i) => i)')
      .replace(/range\((\d+),\s*(\d+)\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');

    const sandbox = {
      console: {
        log: (...args: any[]) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") + "\n"; },
        error: (...args: any[]) => { output += "Error: " + args.join(" ") + "\n"; }
      },
      Math, Date, parseInt, parseFloat, Array, Object, String, Number, Boolean,
      len: (obj: any) => obj?.length ?? 0,
      str: (v: any) => String(v),
      int: (v: any) => parseInt(v, 10),
      float: (v: any) => parseFloat(v),
    };

    const context = vm.createContext(sandbox);
    const script = new vm.Script(jsCode);
    script.runInContext(context, { timeout: 1500 });

    return { success: true, output: output.trim() || 'Код Python успешно выполнен.' };
  } catch (err: any) {
    return {
      success: false,
      isError: true,
      output: `Ошибка при исполнении Python:\n${err.message}`
    };
  }
}

export default async function handler(req: any, res: any) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { code = '', language = 'javascript' } = body;

    if (!code || !code.trim()) {
      return res.status(200).json({ success: true, output: 'Код пуст.' });
    }

    if (language === 'javascript' || language === 'typescript') {
      let output = "";
      const sandbox = {
        console: {
          log: (...args: any[]) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") + "\n"; },
          error: (...args: any[]) => { output += "Error: " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ") + "\n"; }
        },
        print: (...args: any[]) => { output += args.join(" ") + "\n"; },
        Math, Date, parseInt, parseFloat, Array, Object, String, Number, Boolean,
        setTimeout: () => {},
      };

      const context = vm.createContext(sandbox);
      const script = new vm.Script(code);
      script.runInContext(context, { timeout: 1500 });

      return res.status(200).json({ success: true, output: output.trim() || 'Код JavaScript успешно выполнен (нет вывода).' });
    } else if (language === 'python') {
      try {
        // Try native python3 if installed on system
        const stdout = execSync(`python3 -c ${JSON.stringify(code)}`, { timeout: 2000, encoding: 'utf-8' });
        return res.status(200).json({ success: true, output: stdout.trim() || 'Код Python успешно выполнен.' });
      } catch (pyErr: any) {
        if (pyErr.stderr) {
          return res.status(200).json({ success: false, isError: true, output: pyErr.stderr.trim() });
        }
        // Fallback to in-JS Python executor
        const result = runPythonInJS(code);
        return res.status(200).json(result);
      }
    } else {
      return res.status(200).json({
        success: true,
        output: `Код на языке ${language} принят. Для подробного разбора отправьте его на аудит Сократу.`
      });
    }
  } catch (err: any) {
    return res.status(200).json({ success: false, isError: true, output: `Ошибка при исполнении: ${err.message}` });
  }
}
