import {
  activateObjectsLocal,
  parseActivationResults,
} from '../../lib/localGroupActivation';

// Minimal response shape from /sap/bc/adt/activation/results/{id}.
// Two objects: one include that activated cleanly, one with an error pointing
// at its href (line + col encoded in the fragment).
const multiObjectXml = `<?xml version="1.0" encoding="UTF-8"?>
<chkl:messages xmlns:chkl="http://www.sap.com/abapxml/checklist">
  <chkl:properties activationExecuted="true" checkExecuted="true" generationExecuted="true"/>
  <chkl:msg type="E" line="1" href="/sap/bc/adt/programs/includes/zmcp_inc02#start=17,10;end=17,20">
    <chkl:shortText>
      <chkl:txt>Statement is not defined. Please check your spelling.</chkl:txt>
    </chkl:shortText>
  </chkl:msg>
  <chkl:msg type="W" href="/sap/bc/adt/programs/includes/zmcp_inc01#start=3,1">
    <chkl:shortText>
      <chkl:txt>Obsolete statement</chkl:txt>
    </chkl:shortText>
  </chkl:msg>
</chkl:messages>`;

const cleanXml = `<?xml version="1.0" encoding="UTF-8"?>
<chkl:messages xmlns:chkl="http://www.sap.com/abapxml/checklist">
  <chkl:properties activationExecuted="true" checkExecuted="true" generationExecuted="true"/>
</chkl:messages>`;

// ZUNIWTH false-failure repro (S/4HANA 2021, program-with-screens family):
// SAP's /activation/runs results reported generationExecuted="true" with NO
// activationExecuted flag and zero error messages, yet the old parser marked
// every object "failed". The oracle (GetInactiveObjects → 0) confirmed the
// objects were in fact active. generationExecuted="true" + zero errors must
// therefore report activated (lessons-pack layer1 #6/#11).
const generatedNoActivationFlagXml = `<?xml version="1.0" encoding="UTF-8"?>
<chkl:messages xmlns:chkl="http://www.sap.com/abapxml/checklist">
  <chkl:properties checkExecuted="true" generationExecuted="true"/>
</chkl:messages>`;

const inputs = [
  {
    name: 'ZMCP_INC01',
    type: 'PROG/I',
    uri: '/sap/bc/adt/programs/includes/zmcp_inc01',
  },
  {
    name: 'ZMCP_INC02',
    type: 'PROG/I',
    uri: '/sap/bc/adt/programs/includes/zmcp_inc02',
  },
];

describe('parseActivationResults', () => {
  it('marks all objects activated when the response carries no errors', () => {
    const result = parseActivationResults(cleanXml, inputs);
    expect(result.activated).toBe(true);
    expect(result.checked).toBe(true);
    expect(result.generated).toBe(true);
    expect(result.errors).toEqual([]);
    for (const o of result.objects) {
      expect(o.status).toBe('activated');
    }
  });

  it('reports objects activated when the run generated but omitted the activationExecuted flag (ZUNIWTH false-failure, lessons #6/#11)', () => {
    const result = parseActivationResults(generatedNoActivationFlagXml, inputs);
    // The raw activation flag is genuinely absent...
    expect(result.activated).toBe(false);
    expect(result.generated).toBe(true);
    expect(result.errors).toEqual([]);
    // ...but a clean, generated run must not be reported as an all-failed run.
    for (const o of result.objects) {
      expect(o.status).toBe('activated');
    }
  });

  it('attributes messages to the right object by href prefix match', () => {
    const result = parseActivationResults(multiObjectXml, inputs);
    const inc1 = result.objects.find((o) => o.name === 'ZMCP_INC01')!;
    const inc2 = result.objects.find((o) => o.name === 'ZMCP_INC02')!;
    expect(inc1.errors).toHaveLength(0);
    expect(inc1.warnings).toHaveLength(1);
    expect(inc1.warnings[0].line).toBe('3');
    expect(inc1.status).toBe('activated');
    expect(inc2.errors).toHaveLength(1);
    expect(inc2.errors[0].line).toBe('17');
    expect(inc2.errors[0].text).toMatch(/Statement is not defined/);
    expect(inc2.status).toBe('failed');
  });

  it('aggregates errors + warnings at the group level', () => {
    const result = parseActivationResults(multiObjectXml, inputs);
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it('survives empty input (no entries)', () => {
    const result = parseActivationResults('<chkl:messages/>', inputs);
    expect(result.activated).toBe(false);
    expect(result.errors).toEqual([]);
    expect(result.objects).toHaveLength(2);
    // Neither activated nor errored → status defaults to "failed" (not activated)
    for (const o of result.objects) {
      expect(o.status).toBe('failed');
    }
  });
});

// Pins the run-level `success` composition in activateObjectsLocal — the two
// return sites `(parsed.activated || parsed.generated) && errors.length === 0`
// that parseActivationResults' per-object test does not exercise (review nit).
// A generated-only results body (no activationExecuted, zero errors) must yield
// success:true on BOTH the runs and the sync-fallback path.
const okResp = (data: string, headers: Record<string, string> = {}) => ({
  status: 200,
  statusText: 'OK',
  data,
  headers,
  config: {} as any,
});
const generatedOnlyResultsBody = `<?xml version="1.0" encoding="UTF-8"?>
<chkl:messages xmlns:chkl="http://www.sap.com/abapxml/checklist">
  <chkl:properties checkExecuted="true" generationExecuted="true"/>
</chkl:messages>`;

// Minimal IAbapConnection stub; only makeAdtRequest routes per URL/method.
const connStubs = {
  setSessionType() {},
  getSessionMode: () => 'stateless',
  getSessionId: () => 'testsessionid00000000000000000000',
  getBaseUrl: async () => 'https://sap.example.com:44300',
  getAuthHeaders: async () => ({}),
};

describe('activateObjectsLocal run-level success (generated-only run)', () => {
  it('runs endpoint: generationExecuted="true" + 0 errors → success true, all activated', async () => {
    const connection = {
      ...connStubs,
      async makeAdtRequest(o: any) {
        const url = String(o.url);
        const method = String(o.method).toUpperCase();
        if (method === 'POST' && url.includes('/activation/runs')) {
          return okResp('', { location: '/sap/bc/adt/activation/runs/RUN1' });
        }
        if (method === 'GET' && url.includes('/activation/results/')) {
          return okResp(generatedOnlyResultsBody);
        }
        if (method === 'GET' && url.includes('/activation/runs/')) {
          return okResp('<run status="finished"/>');
        }
        throw new Error(`unexpected request ${method} ${url}`);
      },
    };
    const result = await activateObjectsLocal(connection as any, inputs);
    expect(result.endpoint).toBe('runs');
    expect(result.activated).toBe(false); // raw flag genuinely absent
    expect(result.generated).toBe(true);
    expect(result.success).toBe(true); // (activated || generated) && no errors
    for (const o of result.objects) {
      expect(o.status).toBe('activated');
    }
  });

  it('sync fallback: same body over the legacy endpoint → success true', async () => {
    const connection = {
      ...connStubs,
      async makeAdtRequest(o: any) {
        const url = String(o.url);
        const method = String(o.method).toUpperCase();
        if (method === 'POST' && url.includes('/activation/runs')) {
          const err: any = new Error('runs endpoint unavailable');
          err.response = { status: 404 };
          throw err; // → fall back to the sync endpoint
        }
        if (method === 'POST') {
          return okResp(generatedOnlyResultsBody); // /sap/bc/adt/activation
        }
        throw new Error(`unexpected request ${method} ${url}`);
      },
    };
    const result = await activateObjectsLocal(connection as any, inputs);
    expect(result.endpoint).toBe('sync');
    expect(result.generated).toBe(true);
    expect(result.success).toBe(true);
    for (const o of result.objects) {
      expect(o.status).toBe('activated');
    }
  });
});
