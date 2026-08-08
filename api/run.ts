import vm from 'vm';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { code = '', language = 'javascript' } = body;

    if (language === 'javascript') {
      let output = "";
      const sandbox = {
        console: {
          log: (...args: any[]) => { output += args.join(" ") + "\n"; },
          error: (...args: any[]) => { output += "Error: " + args.join(" ") + "\n"; }
        },
        print: (...args: any[]) => { output += args.join(" ") + "\n"; },
        Math, Date, parseInt, parseFloat, Array, Object, String, Number, Boolean,
        setTimeout: () => {},
      };

      const context = vm.createContext(sandbox);
      const script = new vm.Script(code);
      script.runInContext(context, { timeout: 1000 });

      return res.status(200).json({ success: true, output: output || 'Код успешно выполнен (нет вывода).' });
    } else {
      return res.status(200).json({
        success: false,
        output: `Выполнение ${language} не поддерживается в облачной среде Vercel.\nДля работы с ${language} проводите семантический аудит кода через Сократа.`
      });
    }
  } catch (err: any) {
    return res.status(200).json({ success: false, output: `Ошибка при исполнении: ${err.message}` });
  }
}
