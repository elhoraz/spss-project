import React, { useRef, useState, useEffect } from 'react';
import {
  Layers,
  FileText,
  Table as TableIcon,
  BarChart2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { OutputItem } from '../types/spss';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

interface OutputViewerProps {
  outputs: OutputItem[];
  onClearOutputs: () => void;
  onDeleteOutputItem?: (id: string) => void;
  onExport: (format: 'pdf' | 'xlsx' | 'csv' | 'sav' | 'sav_json' | 'word') => void;
}

// Chart Action Toolbar for Exporting as PNG or SVG
const ChartActionToolbar: React.FC<{
  svgRef: React.RefObject<SVGSVGElement | null>;
  title: string;
}> = ({ svgRef, title }) => {
  const [downloading, setDownloading] = useState(false);

  const handleExportPng = () => {
    if (!svgRef.current) return;
    setDownloading(true);
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // High-res 2x
      canvas.width = (svg.clientWidth || 500) * scale;
      canvas.height = (svg.clientHeight || 300) * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `${title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.png`;
        a.href = pngUrl;
        a.click();
      }
      URL.revokeObjectURL(url);
      setDownloading(false);
    };
    img.src = url;
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `${title.toLowerCase().replace(/[^a-z0-9_]/g, '_')}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 8, justifyContent: 'flex-end' }}>
      <button
        className="spss-btn"
        style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={handleExportPng}
        disabled={downloading}
        title="Export Chart as PNG Image"
      >
        <Download size={11} /> Export PNG
      </button>
      <button
        className="spss-btn"
        style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={handleExportSvg}
        title="Export Chart as SVG Vector"
      >
        <Download size={11} /> Export SVG
      </button>
    </div>
  );
};

// -------------------------------------------------------------
// STANDARD IBM SPSS COLLAPSIBLE NOTES TABLE (FASE 8)
// -------------------------------------------------------------
const SPSSNotesTable: React.FC<{ item: OutputItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="spss-notes-container" style={{ marginBottom: 12 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          padding: '3px 8px',
          background: 'var(--bg-header)',
          border: '1px solid var(--border-header)',
          borderRadius: 3,
        }}
        title="Toggle IBM SPSS Standard Notes Table"
      >
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>Notes ({item.title})</span>
      </button>

      {isOpen && (
        <div className="spss-pivot-table-wrapper" style={{ marginTop: 6, maxWidth: 650 }}>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" style={{ width: 140 }}>Category</th>
                <th className="align-left" style={{ width: 180 }}>Item</th>
                <th className="align-left">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left" rowSpan={2} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                  Output Created
                </td>
                <td className="align-left">Timestamp</td>
                <td className="align-left">{item.timestamp}</td>
              </tr>
              <tr>
                <td className="align-left">Procedure</td>
                <td className="align-left">{item.title}</td>
              </tr>
              <tr>
                <td className="align-left" rowSpan={4} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                  Input
                </td>
                <td className="align-left">Active Dataset</td>
                <td className="align-left">DataSet1</td>
              </tr>
              <tr>
                <td className="align-left">Filter</td>
                <td className="align-left">&lt;none&gt;</td>
              </tr>
              <tr>
                <td className="align-left">Weight</td>
                <td className="align-left">&lt;none&gt;</td>
              </tr>
              <tr>
                <td className="align-left">Split File</td>
                <td className="align-left">&lt;none&gt;</td>
              </tr>
              {item.syntax && (
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>Syntax</td>
                  <td className="align-left" colSpan={2} style={{ fontFamily: 'monospace', fontSize: 11, whiteSpace: 'pre-wrap' }}>
                    {item.syntax}
                  </td>
                </tr>
              )}
              <tr>
                <td className="align-left" rowSpan={2} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                  Resources
                </td>
                <td className="align-left">Processor Time</td>
                <td className="align-left">00:00:00.02</td>
              </tr>
              <tr>
                <td className="align-left">Elapsed Time</td>
                <td className="align-left">00:00:00.03</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// REPEATED MEASURES ANOVA COMPONENT (FASE 7)
// -------------------------------------------------------------
const RepeatedMeasuresItemView: React.FC<{ data: any }> = ({ data }) => {
  const { descriptives = [], mauchlys_test, tests_within_subjects = [], tests_between_subjects = [] } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Descriptive Statistics */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 460 }}>
        <div className="spss-pivot-title">Descriptive Statistics</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">Variable</th>
              <th>Mean</th>
              <th>Std. Deviation</th>
              <th>N</th>
            </tr>
          </thead>
          <tbody>
            {descriptives.map((d: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{d.variable}</td>
                <td>{d.mean}</td>
                <td>{d.stdDev}</td>
                <td>{d.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mauchly's Test of Sphericity */}
      {mauchlys_test && (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 720 }}>
          <div className="spss-pivot-title">Mauchly's Test of Sphericity</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" rowSpan={2}>Within Subjects Effect</th>
                <th rowSpan={2}>Mauchly's W</th>
                <th rowSpan={2}>Approx. Chi-Square</th>
                <th rowSpan={2}>df</th>
                <th rowSpan={2}>Sig.</th>
                <th colSpan={3}>Epsilon</th>
              </tr>
              <tr>
                <th>Greenhouse-Geisser</th>
                <th>Huynh-Feldt</th>
                <th>Lower-bound</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>{mauchlys_test.withinSubjectsEffect}</td>
                <td>{mauchlys_test.mauchlysW}</td>
                <td>{mauchlys_test.approxChiSquare}</td>
                <td>{mauchlys_test.df}</td>
                <td style={{ color: mauchlys_test.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: mauchlys_test.sig < 0.05 ? 700 : 400 }}>
                  {mauchlys_test.sig < 0.001 ? '< .001' : mauchlys_test.sig}
                </td>
                <td>{mauchlys_test.greenhouseGeisser}</td>
                <td>{mauchlys_test.huynhFeldt}</td>
                <td>{mauchlys_test.lowerBound}</td>
              </tr>
            </tbody>
          </table>
          <div className="spss-pivot-notes">
            Tests the null hypothesis that the error covariance matrix of the orthonormalized-transformed dependent variables is proportional to an identity matrix.
          </div>
        </div>
      )}

      {/* Tests of Within-Subjects Effects */}
      <div className="spss-pivot-table-wrapper">
        <div className="spss-pivot-title">Tests of Within-Subjects Effects</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">Source</th>
              <th>Type III Sum of Squares</th>
              <th>df</th>
              <th>Mean Square</th>
              <th>F</th>
              <th>Sig.</th>
              <th>Partial Eta Squared</th>
            </tr>
          </thead>
          <tbody>
            {tests_within_subjects.map((row: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: row.source.startsWith('Time') ? 600 : 400 }}>
                  {row.source}
                </td>
                <td>{row.ss}</td>
                <td>{row.df}</td>
                <td>{row.ms}</td>
                <td>{row.f !== null ? row.f : '-'}</td>
                <td style={{ color: row.sig !== null && row.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: row.sig !== null && row.sig < 0.05 ? 700 : 400 }}>
                  {row.sig !== null ? (row.sig < 0.001 ? '< .001' : row.sig) : '-'}
                </td>
                <td>{row.partialEtaSq !== null ? row.partialEtaSq : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tests of Between-Subjects Effects */}
      {tests_between_subjects.length > 0 && (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 580 }}>
          <div className="spss-pivot-title">Tests of Between-Subjects Effects</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Source</th>
                <th>Type III Sum of Squares</th>
                <th>df</th>
                <th>Mean Square</th>
                <th>F</th>
                <th>Sig.</th>
              </tr>
            </thead>
            <tbody>
              {tests_between_subjects.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{row.source}</td>
                  <td>{row.ss}</td>
                  <td>{row.df}</td>
                  <td>{row.ms}</td>
                  <td>{row.f !== null ? row.f : '-'}</td>
                  <td>{row.sig !== null ? (row.sig < 0.001 ? '< .001' : row.sig) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// FRIEDMAN TEST COMPONENT (FASE 7)
// -------------------------------------------------------------
const FriedmanItemView: React.FC<{ data: any }> = ({ data }) => {
  const { ranks = [], test_statistics } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Ranks Table */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 420 }}>
        <div className="spss-pivot-title">Ranks</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">Variable</th>
              <th>Mean Rank</th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((r: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{r.variable}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.meanRank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Test Statistics Table */}
      {test_statistics && (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 360 }}>
          <div className="spss-pivot-title">Test Statistics(a)</div>
          <table className="spss-pivot-table">
            <tbody>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>N</td>
                <td>{test_statistics.n}</td>
              </tr>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>Chi-Square</td>
                <td style={{ fontWeight: 700 }}>{test_statistics.chiSquare}</td>
              </tr>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>df</td>
                <td>{test_statistics.df}</td>
              </tr>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>Asymp. Sig.</td>
                <td style={{ color: test_statistics.asympSig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: test_statistics.asympSig < 0.05 ? 700 : 400 }}>
                  {test_statistics.asympSig < 0.001 ? '< .001' : test_statistics.asympSig}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="spss-pivot-notes">
            a. Friedman Test
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// ORDINAL REGRESSION (PLUM) COMPONENT (FASE 7)
// -------------------------------------------------------------
const OrdinalRegressionItemView: React.FC<{ data: any }> = ({ data }) => {
  const { dependent_variable, model_fitting = [], pseudo_r_squared = [], parameter_estimates } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Model Fitting Information */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 520 }}>
        <div className="spss-pivot-title">Model Fitting Information</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">Model</th>
              <th>-2 Log Likelihood</th>
              <th>Chi-Square</th>
              <th>df</th>
              <th>Sig.</th>
            </tr>
          </thead>
          <tbody>
            {model_fitting.map((m: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{m.model}</td>
                <td>{m.minus2LogLikelihood}</td>
                <td>{m.chiSquare ?? '-'}</td>
                <td>{m.df ?? '-'}</td>
                <td style={{ color: m.sig !== null && m.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: m.sig !== null && m.sig < 0.05 ? 700 : 400 }}>
                  {m.sig !== null ? (m.sig < 0.001 ? '< .001' : m.sig) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="spss-pivot-notes">
          Link function: Logit.
        </div>
      </div>

      {/* Pseudo R-Square */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 360 }}>
        <div className="spss-pivot-title">Pseudo R-Square</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">Measure</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {pseudo_r_squared.map((r: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{r.measure}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Parameter Estimates */}
      {parameter_estimates && (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Parameter Estimates</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Parameter</th>
                <th>Estimate</th>
                <th>Std. Error</th>
                <th>Wald</th>
                <th>df</th>
                <th>Sig.</th>
                <th colSpan={2}>95% Confidence Interval</th>
              </tr>
              <tr>
                <th colSpan={6}></th>
                <th>Lower Bound</th>
                <th>Upper Bound</th>
              </tr>
            </thead>
            <tbody>
              {/* Thresholds */}
              {parameter_estimates.thresholds?.map((t: any, idx: number) => (
                <tr key={`t_${idx}`}>
                  <td className="align-left" style={{ fontWeight: 600 }}>Threshold: {t.label}</td>
                  <td>{t.estimate}</td>
                  <td>{t.se}</td>
                  <td>{t.wald}</td>
                  <td>{t.df}</td>
                  <td style={{ color: t.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: t.sig < 0.05 ? 700 : 400 }}>
                    {t.sig < 0.001 ? '< .001' : t.sig}
                  </td>
                  <td>{t.lowerCI}</td>
                  <td>{t.upperCI}</td>
                </tr>
              ))}

              {/* Locations */}
              {parameter_estimates.locations?.map((l: any, idx: number) => (
                <tr key={`l_${idx}`}>
                  <td className="align-left" style={{ fontWeight: 600 }}>Location: {l.variable}</td>
                  <td style={{ fontWeight: 700 }}>{l.estimate}</td>
                  <td>{l.se}</td>
                  <td>{l.wald}</td>
                  <td>{l.df}</td>
                  <td style={{ color: l.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: l.sig < 0.05 ? 700 : 400 }}>
                    {l.sig < 0.001 ? '< .001' : l.sig}
                  </td>
                  <td>{l.lowerCI}</td>
                  <td>{l.upperCI}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">
            Link function: Logit. Dependent variable: {dependent_variable}.
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// KAPLAN-MEIER SURVIVAL PLOT & TABLES (FASE 7)
// -------------------------------------------------------------
const KaplanMeierItemView: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { time_variable, status_variable, factor_variable, total_n, group_results = [], log_rank_test } = data;

  const chartWidth = 560;
  const chartHeight = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  let maxTime = 1;
  group_results.forEach((g: any) => {
    (g.curvePoints || []).forEach((pt: any) => {
      if (pt.x > maxTime) maxTime = pt.x;
    });
  });

  const scaleX = (t: number) => padding.left + (t / maxTime) * plotW;
  const scaleY = (s: number) => padding.top + plotH - s * plotH;

  const groupColors = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Survival Function Plot */}
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">Survival Function: Kaplan-Meier ({time_variable})</div>
          <ChartActionToolbar svgRef={svgRef} title={`KaplanMeier_${time_variable}`} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            {/* Grid & Axes */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Y axis ticks */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((val) => (
              <g key={val}>
                <line x1={padding.left - 4} y1={scaleY(val)} x2={padding.left} y2={scaleY(val)} stroke="#64748b" />
                <line x1={padding.left} y1={scaleY(val)} x2={padding.left + plotW} y2={scaleY(val)} stroke="#f1f5f9" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={scaleY(val) + 4} textAnchor="end" fontSize="10" fill="#64748b">{val.toFixed(2)}</text>
              </g>
            ))}

            {/* X axis ticks */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
              const tVal = Math.round(maxTime * frac);
              return (
                <g key={frac}>
                  <line x1={scaleX(tVal)} y1={padding.top + plotH} x2={scaleX(tVal)} y2={padding.top + plotH + 4} stroke="#64748b" />
                  <text x={scaleX(tVal)} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{tVal}</text>
                </g>
              );
            })}

            {/* Stepped Survival Curves */}
            {group_results.map((g: any, gIdx: number) => {
              const color = groupColors[gIdx % groupColors.length];
              const pts = g.curvePoints || [];
              if (pts.length === 0) return null;

              let dPath = `M ${scaleX(pts[0].x).toFixed(1)} ${scaleY(pts[0].y).toFixed(1)}`;
              for (let i = 1; i < pts.length; i++) {
                const curr = pts[i];
                dPath += ` H ${scaleX(curr.x).toFixed(1)} V ${scaleY(curr.y).toFixed(1)}`;
              }

              return (
                <g key={g.group}>
                  <path d={dPath} fill="none" stroke={color} strokeWidth="2.5" />
                  {/* Censored marks (+) */}
                  {pts.filter((pt: any) => pt.censored).map((pt: any, pIdx: number) => (
                    <g key={pIdx}>
                      <line x1={scaleX(pt.x) - 4} y1={scaleY(pt.y)} x2={scaleX(pt.x) + 4} y2={scaleY(pt.y)} stroke={color} strokeWidth="2" />
                      <line x1={scaleX(pt.x)} y1={scaleY(pt.y) - 4} x2={scaleX(pt.x)} y2={scaleY(pt.y) + 4} stroke={color} strokeWidth="2" />
                    </g>
                  ))}
                </g>
              );
            })}

            {/* Axis Labels */}
            <text x={padding.left + plotW / 2} y={chartHeight - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
              {time_variable} (Survival Time)
            </text>
            <text
              transform={`rotate(-90 ${padding.left - 38} ${padding.top + plotH / 2})`}
              x={padding.left - 38}
              y={padding.top + plotH / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#334155"
            >
              Cum Survival
            </text>
          </svg>

          {/* Curve Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            {group_results.map((g: any, gIdx: number) => (
              <div key={g.group} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 14, height: 3, background: groupColors[gIdx % groupColors.length], display: 'inline-block' }} />
                <span>{g.group} (N = {g.n})</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <span>+ Censored</span>
            </div>
          </div>
        </div>
      </div>

      {/* Case Processing Summary */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 580 }}>
        <div className="spss-pivot-title">Case Processing Summary</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">{factor_variable || 'Factor'}</th>
              <th>Total N</th>
              <th>N of Events</th>
              <th>Censored (N)</th>
              <th>Percent Censored</th>
            </tr>
          </thead>
          <tbody>
            {group_results.map((g: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{g.group}</td>
                <td>{g.n}</td>
                <td style={{ fontWeight: 600, color: 'var(--danger)' }}>{g.events}</td>
                <td>{g.censored}</td>
                <td>{g.pctCensored}%</td>
              </tr>
            ))}
            <tr className="spss-pivot-total-row">
              <td className="align-left">Overall</td>
              <td>{total_n}</td>
              <td>{group_results.reduce((acc: number, g: any) => acc + g.events, 0)}</td>
              <td>{group_results.reduce((acc: number, g: any) => acc + g.censored, 0)}</td>
              <td>
                {(
                  (group_results.reduce((acc: number, g: any) => acc + g.censored, 0) / (total_n || 1)) *
                  100
                ).toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Means and Medians for Survival Time */}
      <div className="spss-pivot-table-wrapper" style={{ maxWidth: 520 }}>
        <div className="spss-pivot-title">Means and Medians for Survival Time</div>
        <table className="spss-pivot-table">
          <thead>
            <tr>
              <th className="align-left">{factor_variable || 'Factor'}</th>
              <th>Mean Estimate</th>
              <th>Median Estimate</th>
            </tr>
          </thead>
          <tbody>
            {group_results.map((g: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{g.group}</td>
                <td>{g.meanSurvival}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{g.medianSurvival ?? 'Not reached'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Life Table */}
      {group_results[0]?.survivalTable && (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 650 }}>
          <div className="spss-pivot-title">Survival Table: {group_results[0].group}</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Cumulative Survival</th>
                <th>Std. Error</th>
                <th>Cumulative Events</th>
                <th>Number Remaining</th>
              </tr>
            </thead>
            <tbody>
              {group_results[0].survivalTable.slice(0, 15).map((row: any, idx: number) => (
                <tr key={idx}>
                  <td>{row.time}</td>
                  <td>{row.events > 0 ? 'Event' : 'Censored'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.survival}</td>
                  <td>{row.stdError}</td>
                  <td>{row.cumEvents}</td>
                  <td>{row.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {group_results[0].survivalTable.length > 15 && (
            <div className="spss-pivot-notes">
              Showing first 15 time intervals of {group_results[0].survivalTable.length} total.
            </div>
          )}
        </div>
      )}

      {/* Overall Comparisons (Log-Rank Test) */}
      {log_rank_test && (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 440 }}>
          <div className="spss-pivot-title">Overall Comparisons (Log Rank / Mantel-Cox)</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Test</th>
                <th>Chi-Square</th>
                <th>df</th>
                <th>Sig.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>Log Rank (Mantel-Cox)</td>
                <td style={{ fontWeight: 700 }}>{log_rank_test.chiSquare}</td>
                <td>{log_rank_test.df}</td>
                <td style={{ color: log_rank_test.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: log_rank_test.sig < 0.05 ? 700 : 400 }}>
                  {log_rank_test.sig < 0.001 ? '< .001' : log_rank_test.sig}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// INTERACTIVE SORTABLE PIVOT TABLE (FASE 8)
// -------------------------------------------------------------
const InteractiveSortableTable: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = 'spss-pivot-table', style }) => {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (colIdx: number) => {
    let nextDir: 'asc' | 'desc' = 'asc';
    let nextCol: number | null = colIdx;

    if (sortCol === colIdx) {
      if (sortDir === 'asc') {
        nextDir = 'desc';
      } else {
        nextCol = null;
      }
    }

    setSortCol(nextCol);
    setSortDir(nextDir);

    if (!tableRef.current) return;
    const tbody = tableRef.current.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr:not(.spss-pivot-total-row)')) as HTMLTableRowElement[];
    rows.forEach((r, idx) => {
      if (!r.hasAttribute('data-orig-idx')) {
        r.setAttribute('data-orig-idx', String(idx));
      }
    });

    if (nextCol === null) {
      // Restore original order
      rows.sort((a, b) => {
        const origA = parseInt(a.getAttribute('data-orig-idx') || '0', 10);
        const origB = parseInt(b.getAttribute('data-orig-idx') || '0', 10);
        return origA - origB;
      });
    } else {
      const targetCol = nextCol;
      rows.sort((a, b) => {
        const cellA = a.children[targetCol]?.textContent?.trim() || '';
        const cellB = b.children[targetCol]?.textContent?.trim() || '';
        const cleanA = cellA.replace(/[%$,<>\s]/g, '');
        const cleanB = cellB.replace(/[%$,<>\s]/g, '');
        const numA = parseFloat(cleanA);
        const numB = parseFloat(cleanB);
        if (!isNaN(numA) && !isNaN(numB)) {
          return nextDir === 'asc' ? numA - numB : numB - numA;
        }
        return nextDir === 'asc' ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
      });
    }

    const totalRow = tbody.querySelector('.spss-pivot-total-row');
    rows.forEach((r) => tbody.insertBefore(r, totalRow));
  };

  useEffect(() => {
    if (!tableRef.current) return;
    const ths = tableRef.current.querySelectorAll('thead th');
    const cleanups: (() => void)[] = [];

    ths.forEach((th, idx) => {
      const el = th as HTMLElement;
      el.style.cursor = 'pointer';
      el.title = 'Click to sort column (IBM SPSS)';

      // Clear any previous indicators
      const text = el.textContent?.replace(/[▲▼]\s*$/, '').trim() || '';
      el.innerHTML = text;
      if (sortCol === idx) {
        const badge = document.createElement('span');
        badge.style.fontSize = '9px';
        badge.style.marginLeft = '4px';
        badge.style.color = 'var(--accent)';
        badge.textContent = sortDir === 'asc' ? '▲' : '▼';
        el.appendChild(badge);
      }

      const onClick = () => handleHeaderClick(idx);
      el.addEventListener('click', onClick);
      cleanups.push(() => el.removeEventListener('click', onClick));
    });

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [sortCol, sortDir]);

  return (
    <table ref={tableRef} className={className} style={style}>
      {children}
    </table>
  );
};

// Histogram with Normal Curve Component
const HistogramItemView: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { variable, n, mean, std_dev, min, max, bin_counts = [], curve_points = [] } = data;
  const maxCount = Math.max(...bin_counts, 1);
  const chartHeight = 220;
  const chartWidth = 480;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;
  const barWidth = plotW / Math.max(1, bin_counts.length);

  const scaleX = (val: number) => padding.left + ((val - min) / (max - min || 1)) * plotW;
  const scaleY = (count: number) => padding.top + plotH - (count / (maxCount * 1.15)) * plotH;

  const curveD = curve_points.length > 1
    ? curve_points
        .map((pt: any, idx: number) => {
          const xPos = scaleX(pt.x);
          const yPos = scaleY(pt.y);
          return `${idx === 0 ? 'M' : 'L'} ${xPos.toFixed(1)} ${yPos.toFixed(1)}`;
        })
        .join(' ')
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">Histogram with Normal Curve: {variable}</div>
          <ChartActionToolbar svgRef={svgRef} title={`Histogram_${variable}`} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <text x={padding.left - 8} y={scaleY(maxCount) + 4} textAnchor="end" fontSize="10" fill="#64748b">{maxCount}</text>
            <text x={padding.left - 8} y={scaleY(Math.round(maxCount / 2)) + 4} textAnchor="end" fontSize="10" fill="#64748b">{Math.round(maxCount / 2)}</text>
            <text x={padding.left - 8} y={padding.top + plotH + 4} textAnchor="end" fontSize="10" fill="#64748b">0</text>
            {bin_counts.map((cnt: number, bIdx: number) => {
              const x = padding.left + bIdx * barWidth;
              const y = scaleY(cnt);
              const h = Math.max(0, padding.top + plotH - y);
              return (
                <rect
                  key={bIdx}
                  x={x + 1}
                  y={y}
                  width={Math.max(2, barWidth - 2)}
                  height={h}
                  fill="#38bdf8"
                  stroke="#0284c7"
                  strokeWidth="1"
                />
              );
            })}
            {curveD && <path d={curveD} fill="none" stroke="#dc2626" strokeWidth="2.5" />}
            <text x={padding.left} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{min}</text>
            <text x={scaleX(mean)} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#0284c7" fontWeight="bold">{mean}</text>
            <text x={padding.left + plotW} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{max}</text>
            <rect x={chartWidth - 140} y={padding.top + 5} width="120" height="55" fill="#f8fafc" stroke="#cbd5e1" rx="3" />
            <text x={chartWidth - 130} y={padding.top + 20} fontSize="10" fill="#334155" fontWeight="bold">Mean = {mean}</text>
            <text x={chartWidth - 130} y={padding.top + 35} fontSize="10" fill="#334155">Std. Dev. = {std_dev}</text>
            <text x={chartWidth - 130} y={padding.top + 50} fontSize="10" fill="#334155">N = {n}</text>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Scatter Plot with Fit Line Component
const ScatterRegressionItemView: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { x_var, y_var, n, slope, intercept, r, r_squared, equation, points = [], line_start, line_end } = data;
  const chartHeight = 240;
  const chartWidth = 500;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const minX = points.length > 0 ? Math.min(...points.map((p: any) => p.x)) : 0;
  const maxX = points.length > 0 ? Math.max(...points.map((p: any) => p.x)) : 100;
  const minY = points.length > 0 ? Math.min(...points.map((p: any) => p.y)) : 0;
  const maxY = points.length > 0 ? Math.max(...points.map((p: any) => p.y)) : 100;

  const scaleX = (x: number) => padding.left + ((x - minX) / (maxX - minX || 1)) * plotW;
  const scaleY = (y: number) => padding.top + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">Scatter Plot with Fit Line: {y_var} by {x_var}</div>
          <ChartActionToolbar svgRef={svgRef} title={`Scatter_${y_var}_by_${x_var}`} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <text x={padding.left - 8} y={scaleY(maxY) + 4} textAnchor="end" fontSize="10" fill="#64748b">{maxY.toFixed(0)}</text>
            <text x={padding.left - 8} y={scaleY(minY) + 4} textAnchor="end" fontSize="10" fill="#64748b">{minY.toFixed(0)}</text>
            <text x={scaleX(minX)} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{minX.toFixed(0)}</text>
            <text x={scaleX(maxX)} y={padding.top + plotH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{maxX.toFixed(0)}</text>
            <text x={padding.left + plotW / 2} y={padding.top + plotH + 32} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">{x_var}</text>
            {points.map((pt: any, pIdx: number) => (
              <circle
                key={pIdx}
                cx={scaleX(pt.x)}
                cy={scaleY(pt.y)}
                r="3.5"
                fill="#3b82f6"
                opacity="0.75"
                stroke="#1d4ed8"
                strokeWidth="0.8"
              />
            ))}
            {line_start && line_end && (
              <line
                x1={scaleX(line_start.x)}
                y1={scaleY(line_start.y)}
                x2={scaleX(line_end.x)}
                y2={scaleY(line_end.y)}
                stroke="#ef4444"
                strokeWidth="2.5"
              />
            )}
            <rect x={chartWidth - 170} y={padding.top + 5} width="150" height="42" fill="#f8fafc" stroke="#cbd5e1" rx="3" />
            <text x={chartWidth - 160} y={padding.top + 20} fontSize="10" fill="#334155" fontWeight="bold">{equation}</text>
            <text x={chartWidth - 160} y={padding.top + 35} fontSize="10" fill="#ef4444" fontWeight="bold">R² Linear = {r_squared}</text>
          </svg>
        </div>
      </div>
      <div className="spss-pivot-table-wrapper">
        <div className="spss-pivot-title">Model Summary &amp; Parameter Estimates</div>
        <table className="spss-pivot-table" style={{ maxWidth: 460 }}>
          <thead>
            <tr>
              <th className="align-left">Equation</th>
              <th>R</th>
              <th>R Square</th>
              <th>Constant (b0)</th>
              <th>Slope (b1)</th>
              <th>N</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="align-left" style={{ fontWeight: 600 }}>Linear</td>
              <td>{r}</td>
              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r_squared}</td>
              <td>{intercept}</td>
              <td>{slope}</td>
              <td>{n}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Boxplot Item View with Multi-Group Support & Tukey Hinges
const BoxplotItemView: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { variable, factorVar, globalMin = 0, globalMax = 100, groups = [] } = data;

  const chartHeight = 320;
  const padding = { top: 25, right: 30, bottom: 50, left: 65 };
  const plotW = Math.max(380, groups.length * 110);
  const chartWidth = plotW + padding.left + padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const yRange = (globalMax - globalMin) || 1;
  const yMargin = yRange * 0.08;
  const minY = globalMin - yMargin;
  const maxY = globalMax + yMargin;
  const totalYRange = maxY - minY || 1;

  const scaleY = (val: number) => padding.top + plotH - ((val - minY) / totalYRange) * plotH;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">{title}</div>
          <ChartActionToolbar svgRef={svgRef} title={title} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block', overflowX: 'auto', maxWidth: '100%' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />

            {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
              const val = minY + frac * totalYRange;
              const yPos = scaleY(val);
              return (
                <g key={idx}>
                  <line x1={padding.left} y1={yPos} x2={padding.left + plotW} y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
                  <line x1={padding.left - 4} y1={yPos} x2={padding.left} y2={yPos} stroke="#94a3b8" strokeWidth="1" />
                  <text x={padding.left - 8} y={yPos + 4} textAnchor="end" fontSize="10" fill="#64748b">
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {groups.map((g: any, gIdx: number) => {
              const colW = plotW / groups.length;
              const centerX = padding.left + (gIdx + 0.5) * colW;
              const boxW = Math.min(55, colW * 0.55);
              const boxLeft = centerX - boxW / 2;

              const yQ1 = scaleY(g.q1);
              const yMed = scaleY(g.median);
              const yQ3 = scaleY(g.q3);
              const yLowWhisk = scaleY(g.lowerWhisker);
              const yUpWhisk = scaleY(g.upperWhisker);
              const boxH = Math.max(2, yQ1 - yQ3);

              return (
                <g key={gIdx}>
                  <line x1={centerX} y1={yLowWhisk} x2={centerX} y2={yQ1} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1={centerX} y1={yQ3} x2={centerX} y2={yUpWhisk} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

                  <line x1={centerX - boxW * 0.3} y1={yLowWhisk} x2={centerX + boxW * 0.3} y2={yLowWhisk} stroke="#334155" strokeWidth="1.8" />
                  <line x1={centerX - boxW * 0.3} y1={yUpWhisk} x2={centerX + boxW * 0.3} y2={yUpWhisk} stroke="#334155" strokeWidth="1.8" />

                  <rect
                    x={boxLeft}
                    y={yQ3}
                    width={boxW}
                    height={boxH}
                    fill="#e0f2fe"
                    stroke="#0284c7"
                    strokeWidth="1.8"
                    rx="1"
                  />

                  <line x1={boxLeft} y1={yMed} x2={boxLeft + boxW} y2={yMed} stroke="#0369a1" strokeWidth="3" />

                  {g.mildOutliers?.map((out: any, oIdx: number) => {
                    const yOut = scaleY(out.value);
                    return (
                      <g key={oIdx}>
                        <circle cx={centerX} cy={yOut} r="3.5" fill="#fff" stroke="#dc2626" strokeWidth="1.5" />
                        <text x={centerX + 6} y={yOut + 3} fontSize="9" fill="#dc2626" fontWeight="bold">
                          {out.caseNum}
                        </text>
                      </g>
                    );
                  })}

                  {g.extremeOutliers?.map((out: any, eIdx: number) => {
                    const yOut = scaleY(out.value);
                    return (
                      <g key={eIdx}>
                        <text x={centerX} y={yOut + 4} textAnchor="middle" fontSize="13" fill="#b91c1c" fontWeight="bold">
                          *
                        </text>
                        <text x={centerX + 8} y={yOut + 3} fontSize="9" fill="#b91c1c" fontWeight="bold">
                          {out.caseNum}
                        </text>
                      </g>
                    );
                  })}

                  <text x={centerX} y={padding.top + plotH + 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">
                    {g.label}
                  </text>
                  <text x={centerX} y={padding.top + plotH + 32} textAnchor="middle" fontSize="10" fill="#64748b">
                    (N={g.n})
                  </text>
                </g>
              );
            })}

            {factorVar && (
              <text x={padding.left + plotW / 2} y={chartHeight - 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">
                {factorVar}
              </text>
            )}
          </svg>
        </div>
      </div>

      <div className="spss-pivot-table-wrapper">
        <div className="spss-pivot-title">Case Processing Summary</div>
        <table className="spss-pivot-table" style={{ maxWidth: 650 }}>
          <thead>
            <tr>
              <th rowSpan={2} className="align-left">{factorVar ? `${variable} by ${factorVar}` : variable}</th>
              <th colSpan={2}>Valid Cases</th>
              <th colSpan={2}>Missing Cases</th>
              <th colSpan={2}>Total Cases</th>
            </tr>
            <tr>
              <th>N</th>
              <th>Percent</th>
              <th>N</th>
              <th>Percent</th>
              <th>N</th>
              <th>Percent</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{g.label}</td>
                <td>{g.n}</td>
                <td>100.0%</td>
                <td>0</td>
                <td>0.0%</td>
                <td>{g.n}</td>
                <td>100.0%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="spss-pivot-table-wrapper">
        <div className="spss-pivot-title">Percentiles &amp; Tukey's Hinges</div>
        <table className="spss-pivot-table" style={{ maxWidth: 750 }}>
          <thead>
            <tr>
              <th className="align-left">Group</th>
              <th>Minimum</th>
              <th>Lower Whisker</th>
              <th>Q1 (25%)</th>
              <th>Median (50%)</th>
              <th>Q3 (75%)</th>
              <th>Upper Whisker</th>
              <th>Maximum</th>
              <th>IQR</th>
              <th>Outliers</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g: any, idx: number) => (
              <tr key={idx}>
                <td className="align-left" style={{ fontWeight: 600 }}>{g.label}</td>
                <td>{g.min}</td>
                <td>{g.lowerWhisker}</td>
                <td>{g.q1}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{g.median}</td>
                <td>{g.q3}</td>
                <td>{g.upperWhisker}</td>
                <td>{g.max}</td>
                <td>{g.iqr}</td>
                <td>{(g.mildOutliers?.length || 0) + (g.extremeOutliers?.length || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Normal Q-Q Plot and Detrended Normal Q-Q Plot Component
const QQPlotItemView: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const detrendedSvgRef = useRef<SVGSVGElement | null>(null);
  const { variable, n, mean, std_dev, min_obs = 0, max_obs = 100, min_exp = 0, max_exp = 100, points = [] } = data;

  const chartHeight = 280;
  const chartWidth = 460;
  const padding = { top: 25, right: 30, bottom: 45, left: 60 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const minVal = Math.min(min_obs, min_exp);
  const maxVal = Math.max(max_obs, max_exp);
  const valRange = maxVal - minVal || 1;

  const scaleX = (val: number) => padding.left + ((val - minVal) / valRange) * plotW;
  const scaleY = (val: number) => padding.top + plotH - ((val - minVal) / valRange) * plotH;

  const maxDev = Math.max(...points.map((p: any) => Math.abs(p.deviation)), 0.1);
  const scaleDevY = (dev: number) => padding.top + plotH / 2 - (dev / (maxDev * 1.25)) * (plotH / 2);
  const scaleObsX = (obs: number) => padding.left + ((obs - min_obs) / (max_obs - min_obs || 1)) * plotW;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Normal Q-Q Plot */}
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">Normal Q-Q Plot of {variable}</div>
          <ChartActionToolbar svgRef={svgRef} title={`Normal_QQ_${variable}`} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block' }}>
          <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />

            <line x1={scaleX(minVal)} y1={scaleY(minVal)} x2={scaleX(maxVal)} y2={scaleY(maxVal)} stroke="#dc2626" strokeWidth="2" />

            {points.map((p: any, idx: number) => (
              <circle
                key={idx}
                cx={scaleX(p.expected)}
                cy={scaleY(p.observed)}
                r="3"
                fill="#2563eb"
                opacity="0.8"
                stroke="#1d4ed8"
                strokeWidth="0.8"
              />
            ))}

            <text x={padding.left - 10} y={padding.top + 6} textAnchor="end" fontSize="10" fill="#64748b">{maxVal.toFixed(1)}</text>
            <text x={padding.left - 10} y={padding.top + plotH + 4} textAnchor="end" fontSize="10" fill="#64748b">{minVal.toFixed(1)}</text>
            <text x={padding.left} y={padding.top + plotH + 18} textAnchor="middle" fontSize="10" fill="#64748b">{minVal.toFixed(1)}</text>
            <text x={padding.left + plotW} y={padding.top + plotH + 18} textAnchor="middle" fontSize="10" fill="#64748b">{maxVal.toFixed(1)}</text>

            <text x={padding.left + plotW / 2} y={padding.top + plotH + 34} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
              Expected Normal
            </text>
            <text
              transform={`rotate(-90 ${padding.left - 38} ${padding.top + plotH / 2})`}
              x={padding.left - 38}
              y={padding.top + plotH / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#334155"
            >
              Observed Value
            </text>
          </svg>
        </div>
      </div>

      {/* Detrended Normal Q-Q Plot */}
      <div className="spss-pivot-table-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="spss-pivot-title">Detrended Normal Q-Q Plot of {variable}</div>
          <ChartActionToolbar svgRef={detrendedSvgRef} title={`Detrended_QQ_${variable}`} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--border-app)', padding: 16, borderRadius: 4, display: 'inline-block' }}>
          <svg ref={detrendedSvgRef} width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#94a3b8" strokeWidth="1.5" />

            <line x1={padding.left} y1={padding.top + plotH / 2} x2={padding.left + plotW} y2={padding.top + plotH / 2} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 4" />

            {points.map((p: any, idx: number) => (
              <circle
                key={idx}
                cx={scaleObsX(p.observed)}
                cy={scaleDevY(p.deviation)}
                r="3"
                fill="#0284c7"
                opacity="0.8"
                stroke="#0369a1"
                strokeWidth="0.8"
              />
            ))}

            <text x={padding.left - 10} y={scaleDevY(maxDev) + 4} textAnchor="end" fontSize="10" fill="#64748b">+{maxDev.toFixed(2)}</text>
            <text x={padding.left - 10} y={padding.top + plotH / 2 + 4} textAnchor="end" fontSize="10" fill="#dc2626" fontWeight="bold">0.00</text>
            <text x={padding.left - 10} y={scaleDevY(-maxDev) + 4} textAnchor="end" fontSize="10" fill="#64748b">-{maxDev.toFixed(2)}</text>

            <text x={padding.left + plotW / 2} y={padding.top + plotH + 34} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#334155">
              Observed Value
            </text>
            <text
              transform={`rotate(-90 ${padding.left - 38} ${padding.top + plotH / 2})`}
              x={padding.left - 38}
              y={padding.top + plotH / 2}
              textAnchor="middle"
              fontSize="11"
              fontWeight="bold"
              fill="#334155"
            >
              Dev from Normal
            </text>
          </svg>
        </div>
      </div>

      <div className="spss-pivot-table-wrapper">
        <div className="spss-pivot-title">Estimated Distribution Parameters</div>
        <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
          <thead>
            <tr>
              <th className="align-left">Distribution</th>
              <th>Cases (N)</th>
              <th>Location (Mean)</th>
              <th>Scale (Std. Deviation)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="align-left" style={{ fontWeight: 600 }}>Normal</td>
              <td>{n}</td>
              <td style={{ fontWeight: 700 }}>{mean}</td>
              <td>{std_dev}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const OutputViewer: React.FC<OutputViewerProps> = ({ outputs, onClearOutputs, onDeleteOutputItem, onExport }) => {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  const scrollToItem = (id: string) => {
    itemRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleCollapse = (id: string) => {
    setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyTable = (itemId: string) => {
    const cardEl = itemRefs.current[itemId];
    if (!cardEl) return;
    const tableEl = cardEl.querySelector('table');
    if (!tableEl) return;

    const rows = Array.from(tableEl.querySelectorAll('tr'));
    const tsv = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map((cell) => cell.textContent?.trim() || '').join('\t');
      })
      .join('\r\n');

    navigator.clipboard.writeText(tsv);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render SPSS Pivot Tables
  const renderPivotContent = (item: OutputItem) => {
    const { type, data } = item;

    // 1. DESCRIPTIVES PIVOT TABLE
    if (type === 'descriptives') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Descriptive Statistics</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Variable</th>
                <th>N</th>
                <th>Minimum</th>
                <th>Maximum</th>
                <th>Mean</th>
                <th>Std. Error</th>
                <th>Std. Deviation</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {data.rows?.map((row: any, i: number) => (
                <tr key={i}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{row.variable}</td>
                  <td>{row.valid_n}</td>
                  <td>{row.min?.toLocaleString()}</td>
                  <td>{row.max?.toLocaleString()}</td>
                  <td>{row.mean?.toLocaleString()}</td>
                  <td>{row.se_mean}</td>
                  <td>{row.std_dev?.toLocaleString()}</td>
                  <td>{row.variance?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Valid N (listwise) = {data.rows?.[0]?.valid_n || 0}</div>
        </div>
      );
    }

    // 2. FREQUENCIES PIVOT TABLES
    if (type === 'frequencies') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.tables?.map((table: any, tIdx: number) => (
            <div key={tIdx} className="spss-pivot-table-wrapper">
              <div className="spss-pivot-title">{table.variable}</div>
              <table className="spss-pivot-table">
                <thead>
                  <tr>
                    <th className="align-left">Value / Category</th>
                    <th>Frequency</th>
                    <th>Percent</th>
                    <th>Valid Percent</th>
                    <th>Cumulative %</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows?.map((r: any, rIdx: number) => (
                    <tr key={rIdx}>
                      <td className="align-left">{r.label !== r.value ? `${r.label} (${r.value})` : r.value}</td>
                      <td>{r.frequency}</td>
                      <td>{r.percent}%</td>
                      <td>{r.valid_percent}%</td>
                      <td>{r.cumulative_percent}%</td>
                    </tr>
                  ))}
                  <tr className="spss-pivot-total-row">
                    <td className="align-left">Total Valid</td>
                    <td>{table.total_valid}</td>
                    <td>100.0%</td>
                    <td>100.0%</td>
                    <td>-</td>
                  </tr>
                  {table.total_missing > 0 && (
                    <tr>
                      <td className="align-left" style={{ color: 'var(--text-muted)' }}>Missing System</td>
                      <td>{table.total_missing}</td>
                      <td>{((table.total_missing / table.total) * 100).toFixed(1)}%</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }

    // 3. CROSSTABS PIVOT TABLE
    if (type === 'crosstabs') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">{data.title}</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" rowSpan={2}>{data.row_var}</th>
                <th className="align-center" colSpan={data.col_categories?.length || 1}>{data.col_var}</th>
                <th rowSpan={2}>Total</th>
              </tr>
              <tr>
                {data.col_categories?.map((col: string) => (
                  <th key={col} className="align-center">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.row_categories?.map((rowCat: string, rIdx: number) => (
                <tr key={rIdx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{rowCat}</td>
                  {data.cells?.[rIdx]?.map((cell: any, cIdx: number) => (
                    <td key={cIdx}>
                      <div>{cell.count}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Exp: {cell.expected}</div>
                      <div style={{ fontSize: 10, color: 'var(--accent)' }}>{cell.row_percent}%</div>
                    </td>
                  ))}
                  <td style={{ fontWeight: 600 }}>{data.row_totals?.[rIdx]}</td>
                </tr>
              ))}
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total</td>
                {data.col_totals?.map((colTot: number, cIdx: number) => (
                  <td key={cIdx}>{colTot}</td>
                ))}
                <td>{data.grand_total}</td>
              </tr>
            </tbody>
          </table>

          {/* Chi-Square Tests Table */}
          <div style={{ marginTop: 16 }}>
            <div className="spss-pivot-title">Chi-Square Tests</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Test</th>
                  <th>Value</th>
                  <th>df</th>
                  <th>Asymptotic Sig. (2-sided)</th>
                </tr>
              </thead>
              <tbody>
                {data.chi_square_tests?.map((t: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left">{t.test}</td>
                    <td>{t.value}</td>
                    <td>{t.df ?? '-'}</td>
                    <td style={{ fontWeight: t.asymp_sig_2_sided < 0.05 ? 700 : 400, color: t.asymp_sig_2_sided < 0.05 ? 'var(--accent)' : 'inherit' }}>
                      {t.asymp_sig_2_sided ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 4. CORRELATIONS PIVOT TABLE
    if (type === 'correlations') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Correlations</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" colSpan={2}>Variable</th>
                {data.variables?.map((v: string) => (
                  <th key={v} className="align-center">{v}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix?.map((rowItem: any, rIdx: number) => (
                <React.Fragment key={rIdx}>
                  <tr>
                    <td className="align-left" rowSpan={3} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                      {rowItem.variable}
                    </td>
                    <td className="align-left" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pearson Correlation</td>
                    {rowItem.correlations?.map((c: any, cIdx: number) => (
                      <td key={cIdx} style={{ fontWeight: 600 }}>
                        {c.coefficient !== null ? `${c.coefficient}${c.flag}` : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="align-left" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sig. (2-tailed)</td>
                    {rowItem.correlations?.map((c: any, cIdx: number) => (
                      <td key={cIdx} style={{ fontSize: 11 }}>
                        {c.var1 === c.var2 ? '' : c.sig_2_tailed}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-header)' }}>
                    <td className="align-left" style={{ fontSize: 11, color: 'var(--text-muted)' }}>N</td>
                    {rowItem.correlations?.map((c: any, cIdx: number) => (
                      <td key={cIdx} style={{ fontSize: 11 }}>{c.n}</td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">
            {data.notes?.map((n: string, i: number) => (
              <div key={i}>{n}</div>
            ))}
          </div>
        </div>
      );
    }

    // 5. ONE-SAMPLE T-TEST
    if (type === 'one_sample_t_test') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">One-Sample Statistics</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Variable</th>
                <th>N</th>
                <th>Mean</th>
                <th>Std. Deviation</th>
                <th>Std. Error Mean</th>
              </tr>
            </thead>
            <tbody>
              {data.descriptives?.map((d: any, i: number) => (
                <tr key={i}>
                  <td className="align-left">{d.variable}</td>
                  <td>{d.n}</td>
                  <td>{d.mean}</td>
                  <td>{d.std_dev}</td>
                  <td>{d.se_mean}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>One-Sample Test (Test Value = {data.test_value})</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" rowSpan={2}>Variable</th>
                <th rowSpan={2}>t</th>
                <th rowSpan={2}>df</th>
                <th rowSpan={2}>Sig. (2-tailed)</th>
                <th rowSpan={2}>Mean Difference</th>
                <th colSpan={2} className="align-center">95% Confidence Interval</th>
              </tr>
              <tr>
                <th>Lower</th>
                <th>Upper</th>
              </tr>
            </thead>
            <tbody>
              {data.test_results?.map((t: any, i: number) => (
                <tr key={i}>
                  <td className="align-left">{t.variable}</td>
                  <td>{t.t}</td>
                  <td>{t.df}</td>
                  <td style={{ fontWeight: 700, color: t.sig_2_tailed < 0.05 ? 'var(--accent)' : 'inherit' }}>{t.sig_2_tailed}</td>
                  <td>{t.mean_difference}</td>
                  <td>{t.ci_lower}</td>
                  <td>{t.ci_upper}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 6. INDEPENDENT SAMPLES T-TEST
    if (type === 'independent_t_test') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Group Statistics</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Variable</th>
                <th className="align-left">{data.group_variable}</th>
                <th>N</th>
                <th>Mean</th>
                <th>Std. Deviation</th>
                <th>Std. Error Mean</th>
              </tr>
            </thead>
            <tbody>
              {data.group_statistics?.map((g: any, i: number) => (
                <tr key={i}>
                  <td className="align-left">{g.variable}</td>
                  <td className="align-left">{g.group}</td>
                  <td>{g.n}</td>
                  <td>{g.mean}</td>
                  <td>{g.std_dev}</td>
                  <td>{g.se_mean}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>Independent Samples Test</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" rowSpan={2}>Variable</th>
                <th colSpan={2} className="align-center">Levene's Test for Equality of Variances</th>
                <th colSpan={5} className="align-center">t-test for Equality of Means</th>
              </tr>
              <tr>
                <th>F</th>
                <th>Sig.</th>
                <th>t</th>
                <th>df</th>
                <th>Sig. (2-tailed)</th>
                <th>Mean Diff</th>
                <th>Std. Error Diff</th>
              </tr>
            </thead>
            <tbody>
              {data.test_results?.map((t: any, i: number) => (
                <React.Fragment key={i}>
                  <tr>
                    <td className="align-left" style={{ fontWeight: 600 }}>Equal variances assumed</td>
                    <td>{t.levene_f}</td>
                    <td>{t.levene_sig}</td>
                    <td>{t.equal_var_assumed?.t}</td>
                    <td>{t.equal_var_assumed?.df}</td>
                    <td style={{ fontWeight: 700 }}>{t.equal_var_assumed?.sig_2_tailed}</td>
                    <td>{t.equal_var_assumed?.mean_diff}</td>
                    <td>{t.equal_var_assumed?.se_diff}</td>
                  </tr>
                  <tr>
                    <td className="align-left" style={{ color: 'var(--text-muted)' }}>Equal variances not assumed</td>
                    <td>-</td>
                    <td>-</td>
                    <td>{t.equal_var_not_assumed?.t}</td>
                    <td>{t.equal_var_not_assumed?.df}</td>
                    <td>{t.equal_var_not_assumed?.sig_2_tailed}</td>
                    <td>{t.equal_var_not_assumed?.mean_diff}</td>
                    <td>{t.equal_var_not_assumed?.se_diff}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 7. ONE-WAY ANOVA
    if (type === 'one_way_anova') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Descriptives</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">{data.factor_variable}</th>
                <th>N</th>
                <th>Mean</th>
                <th>Std. Deviation</th>
                <th>Std. Error</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {data.descriptives?.map((d: any, i: number) => (
                <tr key={i} className={d.group === 'Total' ? 'spss-pivot-total-row' : ''}>
                  <td className="align-left">{d.group}</td>
                  <td>{d.n}</td>
                  <td>{d.mean}</td>
                  <td>{d.std_dev}</td>
                  <td>{d.se_mean}</td>
                  <td>{d.min}</td>
                  <td>{d.max}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>ANOVA</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Source of Variation</th>
                <th>Sum of Squares</th>
                <th>df</th>
                <th>Mean Square</th>
                <th>F</th>
                <th>Sig.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left">Between Groups</td>
                <td>{data.anova_table?.between_groups?.sum_of_squares}</td>
                <td>{data.anova_table?.between_groups?.df}</td>
                <td>{data.anova_table?.between_groups?.mean_square}</td>
                <td style={{ fontWeight: 700 }}>{data.anova_table?.between_groups?.f}</td>
                <td style={{ fontWeight: 700, color: data.anova_table?.between_groups?.sig < 0.05 ? 'var(--accent)' : 'inherit' }}>
                  {data.anova_table?.between_groups?.sig}
                </td>
              </tr>
              <tr>
                <td className="align-left">Within Groups</td>
                <td>{data.anova_table?.within_groups?.sum_of_squares}</td>
                <td>{data.anova_table?.within_groups?.df}</td>
                <td>{data.anova_table?.within_groups?.mean_square}</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total</td>
                <td>{data.anova_table?.total?.sum_of_squares}</td>
                <td>{data.anova_table?.total?.df}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          {data.post_hoc?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="spss-pivot-title">Multiple Comparisons: Tukey HSD</div>
              <table className="spss-pivot-table">
                <thead>
                  <tr>
                    <th className="align-left">(I) {data.factor_variable}</th>
                    <th className="align-left">(J) {data.factor_variable}</th>
                    <th>Mean Difference (I-J)</th>
                    <th>Std. Error</th>
                    <th>Sig.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.post_hoc.map((ph: any, i: number) => (
                    <tr key={i}>
                      <td className="align-left">{ph.group_i}</td>
                      <td className="align-left">{ph.group_j}</td>
                      <td>{ph.mean_diff}</td>
                      <td>{ph.se}</td>
                      <td style={{ fontWeight: ph.significant ? 700 : 400, color: ph.significant ? 'var(--accent)' : 'inherit' }}>
                        {ph.sig} {ph.significant ? '*' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    // 8. LINEAR REGRESSION
    if (type === 'linear_regression') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Model Summary</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>R</th>
                <th>R Square</th>
                <th>Adjusted R Square</th>
                <th>Std. Error of the Estimate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{data.model_summary?.r}</td>
                <td style={{ fontWeight: 700 }}>{data.model_summary?.r_squared}</td>
                <td>{data.model_summary?.adjusted_r_squared}</td>
                <td>{data.model_summary?.std_error_estimate}</td>
              </tr>
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>ANOVA</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Model</th>
                <th>Sum of Squares</th>
                <th>df</th>
                <th>Mean Square</th>
                <th>F</th>
                <th>Sig.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left">Regression</td>
                <td>{data.anova?.regression?.sum_of_squares}</td>
                <td>{data.anova?.regression?.df}</td>
                <td>{data.anova?.regression?.mean_square}</td>
                <td style={{ fontWeight: 700 }}>{data.anova?.regression?.f}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{data.anova?.regression?.sig}</td>
              </tr>
              <tr>
                <td className="align-left">Residual</td>
                <td>{data.anova?.residual?.sum_of_squares}</td>
                <td>{data.anova?.residual?.df}</td>
                <td>{data.anova?.residual?.mean_square}</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total</td>
                <td>{data.anova?.total?.sum_of_squares}</td>
                <td>{data.anova?.total?.df}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>Coefficients</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left" rowSpan={2}>Model</th>
                <th colSpan={2} className="align-center">Unstandardized Coefficients</th>
                <th className="align-center">Standardized</th>
                <th rowSpan={2}>t</th>
                <th rowSpan={2}>Sig.</th>
              </tr>
              <tr>
                <th>B</th>
                <th>Std. Error</th>
                <th>Beta</th>
              </tr>
            </thead>
            <tbody>
              {data.coefficients?.map((c: any, i: number) => (
                <tr key={i}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{c.term}</td>
                  <td>{c.b}</td>
                  <td>{c.se}</td>
                  <td>{c.beta ?? '-'}</td>
                  <td>{c.t}</td>
                  <td style={{ fontWeight: c.sig < 0.05 ? 700 : 400 }}>{c.sig}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Dependent Variable: {data.dependent_variable}</div>
        </div>
      );
    }

    // 8.1 TWO-WAY ANOVA
    if (type === 'two_way_anova') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Tests of Between-Subjects Effects</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Source</th>
                <th>Type III Sum of Squares</th>
                <th>df</th>
                <th>Mean Square</th>
                <th>F</th>
                <th>Sig.</th>
              </tr>
            </thead>
            <tbody>
              {data.between_subjects_effects?.map((row: any, i: number) => (
                <tr key={i} className={row.source === 'Total' ? 'spss-pivot-total-row' : ''}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{row.source}</td>
                  <td>{row.sum_of_squares?.toLocaleString()}</td>
                  <td>{row.df}</td>
                  <td>{row.mean_square !== null ? row.mean_square?.toLocaleString() : '-'}</td>
                  <td style={{ fontWeight: row.f !== null ? 700 : 400 }}>{row.f !== null ? row.f : '-'}</td>
                  <td style={{ fontWeight: row.sig !== null && row.sig < 0.05 ? 700 : 400, color: row.sig !== null && row.sig < 0.05 ? 'var(--accent)' : 'inherit' }}>
                    {row.sig !== null ? row.sig : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Dependent Variable: {data.dependent_variable}</div>
        </div>
      );
    }

    // 8.2 RELIABILITY (CRONBACH'S ALPHA)
    if (type === 'reliability') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Reliability Statistics</div>
          <table className="spss-pivot-table" style={{ maxWidth: 420 }}>
            <thead>
              <tr>
                <th>Cronbach's Alpha</th>
                <th>N of Items</th>
                <th>Scale Mean</th>
                <th>Scale Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, fontSize: 13, color: data.cronbach_alpha >= 0.7 ? '#16a34a' : 'inherit' }}>
                  {data.cronbach_alpha}
                </td>
                <td>{data.n_items}</td>
                <td>{data.scale_mean}</td>
                <td>{data.scale_variance}</td>
              </tr>
            </tbody>
          </table>

          {data.item_total_statistics && (
            <div style={{ marginTop: 16 }}>
              <div className="spss-pivot-title">Item-Total Statistics</div>
              <table className="spss-pivot-table">
                <thead>
                  <tr>
                    <th className="align-left">Item</th>
                    <th>Scale Mean if Item Deleted</th>
                    <th>Scale Variance if Item Deleted</th>
                    <th>Corrected Item-Total Correlation</th>
                    <th>Cronbach's Alpha if Item Deleted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.item_total_statistics.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="align-left" style={{ fontWeight: 600 }}>{it.item}</td>
                      <td>{it.scale_mean_if_deleted}</td>
                      <td>{it.scale_variance_if_deleted}</td>
                      <td style={{ fontWeight: it.corrected_item_total_correlation > 0.3 ? 600 : 400 }}>
                        {it.corrected_item_total_correlation}
                      </td>
                      <td style={{ fontWeight: 700 }}>{it.cronbach_alpha_if_deleted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="spss-pivot-notes">a. Valid N of Cases = {data.n_cases} (Listwise deletion based on all variables in the scale).</div>
        </div>
      );
    }

    // 8.3 MANN-WHITNEY U TEST
    if (type === 'mann_whitney') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Ranks</div>
          <table className="spss-pivot-table" style={{ maxWidth: 480 }}>
            <thead>
              <tr>
                <th className="align-left">{data.group_variable}</th>
                <th>N</th>
                <th>Mean Rank</th>
                <th>Sum of Ranks</th>
              </tr>
            </thead>
            <tbody>
              {data.ranks?.map((r: any, idx: number) => (
                <tr key={idx} className={r.group === 'Total' ? 'spss-pivot-total-row' : ''}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{r.group}</td>
                  <td>{r.n}</td>
                  <td>{r.mean_rank !== null ? r.mean_rank : '-'}</td>
                  <td>{r.sum_of_ranks !== null ? r.sum_of_ranks : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>Test Statistics</div>
          <table className="spss-pivot-table" style={{ maxWidth: 360 }}>
            <thead>
              <tr>
                <th className="align-left">Statistic</th>
                <th>{data.test_variable}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left">Mann-Whitney U</td>
                <td style={{ fontWeight: 700 }}>{data.test_statistics?.mann_whitney_u}</td>
              </tr>
              <tr>
                <td className="align-left">Wilcoxon W</td>
                <td>{data.test_statistics?.wilcoxon_w}</td>
              </tr>
              <tr>
                <td className="align-left">Z</td>
                <td>{data.test_statistics?.z}</td>
              </tr>
              <tr>
                <td className="align-left">Asymp. Sig. (2-tailed)</td>
                <td style={{ fontWeight: 700, color: data.test_statistics?.asymp_sig_2_tailed < 0.05 ? 'var(--accent)' : 'inherit' }}>
                  {data.test_statistics?.asymp_sig_2_tailed}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Grouping Variable: {data.group_variable}</div>
        </div>
      );
    }

    // 8.4 WILCOXON SIGNED-RANK TEST
    if (type === 'wilcoxon') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Ranks</div>
          <table className="spss-pivot-table" style={{ maxWidth: 540 }}>
            <thead>
              <tr>
                <th className="align-left">Comparison</th>
                <th>Rank Category</th>
                <th>N</th>
                <th>Mean Rank</th>
                <th>Sum of Ranks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={4} className="align-left" style={{ fontWeight: 600 }}>{data.pairs}</td>
                <td className="align-left">Negative Ranks</td>
                <td>{data.ranks_summary?.negative_ranks_n}</td>
                <td>{data.ranks_summary?.negative_ranks_mean}</td>
                <td>{data.ranks_summary?.negative_ranks_sum}</td>
              </tr>
              <tr>
                <td className="align-left">Positive Ranks</td>
                <td>{data.ranks_summary?.positive_ranks_n}</td>
                <td>{data.ranks_summary?.positive_ranks_mean}</td>
                <td>{data.ranks_summary?.positive_ranks_sum}</td>
              </tr>
              <tr>
                <td className="align-left">Ties</td>
                <td>{data.ranks_summary?.ties_n}</td>
                <td>-</td>
                <td>-</td>
              </tr>
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total</td>
                <td>{data.ranks_summary?.total_n}</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>Test Statistics</div>
          <table className="spss-pivot-table" style={{ maxWidth: 360 }}>
            <thead>
              <tr>
                <th className="align-left">Statistic</th>
                <th>{data.pairs}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left">Z</td>
                <td>{data.test_statistics?.z}</td>
              </tr>
              <tr>
                <td className="align-left">Asymp. Sig. (2-tailed)</td>
                <td style={{ fontWeight: 700, color: data.test_statistics?.asymp_sig_2_tailed < 0.05 ? 'var(--accent)' : 'inherit' }}>
                  {data.test_statistics?.asymp_sig_2_tailed}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Based on negative ranks. b. Wilcoxon Signed Ranks Test</div>
        </div>
      );
    }

    // 8.5 KRUSKAL-WALLIS TEST
    if (type === 'kruskal_wallis') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Ranks</div>
          <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
            <thead>
              <tr>
                <th className="align-left">{data.group_variable}</th>
                <th>N</th>
                <th>Mean Rank</th>
                <th>Sum of Ranks</th>
              </tr>
            </thead>
            <tbody>
              {data.ranks?.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{r.group}</td>
                  <td>{r.n}</td>
                  <td>{r.mean_rank}</td>
                  <td>{r.sum_of_ranks}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="spss-pivot-title" style={{ marginTop: 16 }}>Test Statistics</div>
          <table className="spss-pivot-table" style={{ maxWidth: 360 }}>
            <thead>
              <tr>
                <th className="align-left">Statistic</th>
                <th>{data.test_variable}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-left">Kruskal-Wallis H</td>
                <td style={{ fontWeight: 700 }}>{data.test_statistics?.kruskal_wallis_h}</td>
              </tr>
              <tr>
                <td className="align-left">df</td>
                <td>{data.test_statistics?.df}</td>
              </tr>
              <tr>
                <td className="align-left">Asymp. Sig.</td>
                <td style={{ fontWeight: 700, color: data.test_statistics?.asymp_sig < 0.05 ? 'var(--accent)' : 'inherit' }}>
                  {data.test_statistics?.asymp_sig}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Kruskal Wallis Test. Grouping Variable: {data.group_variable}</div>
        </div>
      );
    }

    // 8.6 EXPLORE & NORMALITY TESTS
    if (type === 'explore') {
      const results = data.results || {};
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(results).map(([varName, vData]: [string, any], idx: number) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Case Processing Summary */}
              <div className="spss-pivot-table-wrapper">
                <div className="spss-pivot-title">Case Processing Summary - {varName}</div>
                <table className="spss-pivot-table">
                  <thead>
                    <tr>
                      <th className="align-left" rowSpan={2}>Variable</th>
                      <th colSpan={2}>Valid</th>
                      <th colSpan={2}>Missing</th>
                      <th colSpan={2}>Total</th>
                    </tr>
                    <tr>
                      <th>N</th>
                      <th>Percent</th>
                      <th>N</th>
                      <th>Percent</th>
                      <th>N</th>
                      <th>Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="align-left" style={{ fontWeight: 600 }}>{varName}</td>
                      <td>{vData.case_processing?.valid_n}</td>
                      <td>{vData.case_processing?.valid_percent}%</td>
                      <td>{vData.case_processing?.missing_n}</td>
                      <td>{vData.case_processing?.missing_percent}%</td>
                      <td>{vData.case_processing?.total_n}</td>
                      <td>100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Descriptives Table */}
              <div className="spss-pivot-table-wrapper">
                <div className="spss-pivot-title">Descriptives - {varName}</div>
                <table className="spss-pivot-table" style={{ maxWidth: 520 }}>
                  <thead>
                    <tr>
                      <th className="align-left">Statistic</th>
                      <th>Estimate</th>
                      <th>Std. Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="align-left" style={{ fontWeight: 600 }}>Mean</td>
                      <td>{vData.descriptives?.mean}</td>
                      <td>{vData.descriptives?.se_mean}</td>
                    </tr>
                    <tr>
                      <td className="align-left" style={{ paddingLeft: 16 }}>95% Confidence Interval for Mean: Lower Bound</td>
                      <td>{vData.descriptives?.ci_95_lower}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left" style={{ paddingLeft: 16 }}>Upper Bound</td>
                      <td>{vData.descriptives?.ci_95_upper}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">5% Trimmed Mean</td>
                      <td>{vData.descriptives?.trimmed_mean_5pct}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Median</td>
                      <td>{vData.descriptives?.median}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Variance</td>
                      <td>{vData.descriptives?.variance}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Std. Deviation</td>
                      <td>{vData.descriptives?.std_deviation}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Minimum</td>
                      <td>{vData.descriptives?.minimum}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Maximum</td>
                      <td>{vData.descriptives?.maximum}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Range</td>
                      <td>{vData.descriptives?.range}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Interquartile Range</td>
                      <td>{vData.descriptives?.interquartile_range}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="align-left">Skewness</td>
                      <td>{vData.descriptives?.skewness}</td>
                      <td>{vData.descriptives?.se_skewness || ''}</td>
                    </tr>
                    <tr>
                      <td className="align-left">Kurtosis</td>
                      <td>{vData.descriptives?.kurtosis}</td>
                      <td>{vData.descriptives?.se_kurtosis || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tests of Normality */}
              <div className="spss-pivot-table-wrapper">
                <div className="spss-pivot-title">Tests of Normality - {varName}</div>
                <table className="spss-pivot-table" style={{ maxWidth: 520 }}>
                  <thead>
                    <tr>
                      <th className="align-left" rowSpan={2}>Variable</th>
                      <th colSpan={3}>Kolmogorov-Smirnov<sup>a</sup></th>
                      <th colSpan={3}>Shapiro-Wilk</th>
                    </tr>
                    <tr>
                      <th>Statistic</th>
                      <th>df</th>
                      <th>Sig.</th>
                      <th>Statistic</th>
                      <th>df</th>
                      <th>Sig.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="align-left" style={{ fontWeight: 600 }}>{varName}</td>
                      <td>{vData.tests_of_normality?.kolmogorov_smirnov?.statistic}</td>
                      <td>{vData.tests_of_normality?.kolmogorov_smirnov?.df}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {vData.tests_of_normality?.kolmogorov_smirnov?.sig}
                      </td>
                      <td>{vData.tests_of_normality?.shapiro_wilk?.statistic}</td>
                      <td>{vData.tests_of_normality?.shapiro_wilk?.df}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {vData.tests_of_normality?.shapiro_wilk?.sig}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="spss-pivot-notes">a. Lilliefors Significance Correction</div>
              </div>

              {/* Extreme Values */}
              <div className="spss-pivot-table-wrapper">
                <div className="spss-pivot-title">Extreme Values - {varName}</div>
                <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
                  <thead>
                    <tr>
                      <th className="align-left">Category</th>
                      <th>Rank</th>
                      <th>Case Number</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vData.extreme_values?.highest?.map((h: any, i: number) => (
                      <tr key={`h-${i}`}>
                        {i === 0 && (
                          <td className="align-left" rowSpan={5} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                            Highest
                          </td>
                        )}
                        <td>{h.rank}</td>
                        <td>{h.case_number}</td>
                        <td>{h.value?.toLocaleString()}</td>
                      </tr>
                    ))}
                    {vData.extreme_values?.lowest?.map((l: any, i: number) => (
                      <tr key={`l-${i}`}>
                        {i === 0 && (
                          <td className="align-left" rowSpan={5} style={{ fontWeight: 600, verticalAlign: 'top' }}>
                            Lowest
                          </td>
                        )}
                        <td>{l.rank}</td>
                        <td>{l.case_number}</td>
                        <td>{l.value?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 8.7 FACTOR ANALYSIS
    if (type === 'factor_analysis') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KMO and Bartlett's Test */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">KMO and Bartlett's Test</div>
            <table className="spss-pivot-table" style={{ maxWidth: 460 }}>
              <tbody>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>
                    Kaiser-Meyer-Olkin Measure of Sampling Adequacy
                  </td>
                  <td style={{ fontWeight: 700 }}>{data.kmo_and_bartlett?.kmo_measure}</td>
                </tr>
                <tr>
                  <td className="align-left">Bartlett's Test of Sphericity: Approx. Chi-Square</td>
                  <td>{data.kmo_and_bartlett?.bartlett_approx_chi_square}</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ paddingLeft: 24 }}>df</td>
                  <td>{data.kmo_and_bartlett?.bartlett_df}</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ paddingLeft: 24 }}>Sig.</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {data.kmo_and_bartlett?.bartlett_sig}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Communalities Table */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Communalities</div>
            <table className="spss-pivot-table" style={{ maxWidth: 360 }}>
              <thead>
                <tr>
                  <th className="align-left">Variable</th>
                  <th>Initial</th>
                  <th>Extraction</th>
                </tr>
              </thead>
              <tbody>
                {data.communalities?.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{c.variable}</td>
                    <td>{c.initial?.toFixed(3)}</td>
                    <td style={{ fontWeight: 700 }}>{c.extraction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="spss-pivot-notes">Extraction Method: Principal Component Analysis.</div>
          </div>

          {/* Total Variance Explained */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Total Variance Explained</div>
            <table className="spss-pivot-table" style={{ maxWidth: 520 }}>
              <thead>
                <tr>
                  <th className="align-left">Component</th>
                  <th>Initial Eigenvalues Total</th>
                  <th>% of Variance</th>
                  <th>Cumulative %</th>
                </tr>
              </thead>
              <tbody>
                {data.total_variance_explained?.map((ve: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{ve.component}</td>
                    <td style={{ fontWeight: ve.eigenvalue >= 1.0 ? 700 : 400 }}>{ve.eigenvalue}</td>
                    <td>{ve.percent_of_variance}%</td>
                    <td style={{ fontWeight: 700 }}>{ve.cumulative_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rotated Component Matrix */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Rotated Component Matrix<sup>a</sup></div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Variable</th>
                  {Object.keys(data.rotated_component_matrix?.[0] || {})
                    .filter((k) => k !== 'variable')
                    .map((compKey, kIdx) => (
                      <th key={kIdx}>{compKey}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.rotated_component_matrix?.map((row: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{row.variable}</td>
                    {Object.keys(row)
                      .filter((k) => k !== 'variable')
                      .map((compKey, kIdx) => (
                        <td key={kIdx} style={{ fontWeight: Math.abs(row[compKey]) >= 0.5 ? 700 : 400 }}>
                          {row[compKey]}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="spss-pivot-notes">
              Extraction Method: Principal Component Analysis. Rotation Method: Varimax with Kaiser Normalization.
            </div>
          </div>
        </div>
      );
    }

    // 8.8 BINARY LOGISTIC REGRESSION
    if (type === 'logistic_regression') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Dependent Variable Encoding */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Dependent Variable Encoding</div>
            <table className="spss-pivot-table" style={{ maxWidth: 360 }}>
              <thead>
                <tr>
                  <th className="align-left">Original Value</th>
                  <th>Internal Value</th>
                </tr>
              </thead>
              <tbody>
                {data.dependent_encoding?.map((enc: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{enc.original_value}</td>
                    <td>{enc.internal_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Omnibus Tests */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Omnibus Tests of Model Coefficients</div>
            <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
              <thead>
                <tr>
                  <th className="align-left">Step 1</th>
                  <th>Chi-square</th>
                  <th>df</th>
                  <th>Sig.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left">Step</td>
                  <td>{data.omnibus_tests?.chi_square}</td>
                  <td>{data.omnibus_tests?.df}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{data.omnibus_tests?.sig}</td>
                </tr>
                <tr>
                  <td className="align-left">Block</td>
                  <td>{data.omnibus_tests?.chi_square}</td>
                  <td>{data.omnibus_tests?.df}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{data.omnibus_tests?.sig}</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>Model</td>
                  <td style={{ fontWeight: 700 }}>{data.omnibus_tests?.chi_square}</td>
                  <td>{data.omnibus_tests?.df}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{data.omnibus_tests?.sig}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Model Summary */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Model Summary</div>
            <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>-2 Log likelihood</th>
                  <th>Cox & Snell R Square</th>
                  <th>Nagelkerke R Square</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{data.model_summary?.minus_2_log_likelihood}</td>
                  <td>{data.model_summary?.cox_snell_r2}</td>
                  <td style={{ fontWeight: 700 }}>{data.model_summary?.nagelkerke_r2}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Classification Table */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Classification Table<sup>a</sup></div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left" rowSpan={3}>Observed</th>
                  <th colSpan={3}>Predicted</th>
                </tr>
                <tr>
                  <th colSpan={2}>{data.dependent_variable}</th>
                  <th rowSpan={2}>Percentage Correct</th>
                </tr>
                <tr>
                  <th>{data.classification_table?.group_0_label}</th>
                  <th>{data.classification_table?.group_1_label}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>{data.classification_table?.group_0_label}</td>
                  <td>{data.classification_table?.n00}</td>
                  <td>{data.classification_table?.n01}</td>
                  <td>{data.classification_table?.percent_correct_0}%</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>{data.classification_table?.group_1_label}</td>
                  <td>{data.classification_table?.n10}</td>
                  <td>{data.classification_table?.n11}</td>
                  <td>{data.classification_table?.percent_correct_1}%</td>
                </tr>
                <tr className="spss-pivot-total-row">
                  <td className="align-left" style={{ fontWeight: 700 }}>Overall Percentage</td>
                  <td></td>
                  <td></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {data.classification_table?.overall_percent}%
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="spss-pivot-notes">a. The cut value is .500</div>
          </div>

          {/* Variables in the Equation */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Variables in the Equation</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Variable</th>
                  <th>B</th>
                  <th>S.E.</th>
                  <th>Wald</th>
                  <th>df</th>
                  <th>Sig.</th>
                  <th>Exp(B)</th>
                  <th>95% C.I. for EXP(B) Lower</th>
                  <th>Upper</th>
                </tr>
              </thead>
              <tbody>
                {data.variables_in_equation?.map((row: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{row.variable}</td>
                    <td>{row.b}</td>
                    <td>{row.se}</td>
                    <td>{row.wald}</td>
                    <td>{row.df}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.sig}</td>
                    <td style={{ fontWeight: 700 }}>{row.exp_b}</td>
                    <td>{row.ci_lower}</td>
                    <td>{row.ci_upper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="spss-pivot-notes">a. Variable(s) entered on step 1: {data.covariates?.join(', ')}.</div>
          </div>
        </div>
      );
    }

    // 8.9 DATA MANAGEMENT LOG
    if (type === 'data_management') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Data Management Operation Completed</div>
          <table className="spss-pivot-table" style={{ maxWidth: 500 }}>
            <thead>
              <tr>
                <th className="align-left">Parameter</th>
                <th className="align-left">Status / Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, val], idx) => (
                <tr key={idx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{key}</td>
                  <td className="align-left">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // 9. CHARTS
    if (type === 'chart') {
      const { chartType, xVar, _yVar, rows = [] } = data;

      // Extract data for chart
      const xVals = rows.map((r: any) => r[xVar]);
      const counts: Record<string, number> = {};
      xVals.forEach((x: any) => {
        if (x !== undefined && x !== null) {
          const k = String(x);
          counts[k] = (counts[k] || 0) + 1;
        }
      });

      const labels = Object.keys(counts).slice(0, 15);
      const values = labels.map((l) => counts[l]);

      const chartData = {
        labels,
        datasets: [
          {
            label: `Frequency of ${xVar}`,
            data: values,
            backgroundColor: [
              '#1976d2',
              '#38bdf8',
              '#10b981',
              '#f59e0b',
              '#ec4899',
              '#8b5cf6',
              '#6366f1',
              '#14b8a6',
            ],
            borderColor: '#0f172a',
            borderWidth: 1,
          },
        ],
      };

      return (
        <div style={{ maxWidth: 640, margin: '12px 0', background: 'var(--bg-surface)', padding: 16, borderRadius: 6, border: '1px solid var(--border-app)' }}>
          {chartType === 'pie' ? (
            <div style={{ maxWidth: 360, margin: '0 auto' }}>
              <Pie data={chartData} />
            </div>
          ) : chartType === 'line' ? (
            <Line data={chartData} />
          ) : chartType === 'boxplot' ? (
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-main)' }}>
                Boxplot of {xVar}
              </div>
              {(() => {
                const nums = xVals.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v)).sort((a: number, b: number) => a - b);
                if (nums.length < 4) {
                  return <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not enough numeric data for boxplot.</div>;
                }
                const min = nums[0];
                const max = nums[nums.length - 1];
                const q1 = nums[Math.floor(nums.length * 0.25)];
                const med = nums[Math.floor(nums.length * 0.5)];
                const q3 = nums[Math.floor(nums.length * 0.75)];
                const iqr = q3 - q1;
                const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
                const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
                const outliers = nums.filter((v: number) => v < lowerWhisker || v > upperWhisker);

                const range = (max - min) || 1;
                const toY = (val: number) => 180 - ((val - min) / range) * 150;

                return (
                  <svg width="100%" height="220" viewBox="0 0 300 220" style={{ background: '#f8fafc', borderRadius: 4 }}>
                    {/* Y Axis line */}
                    <line x1="60" y1="20" x2="60" y2="190" stroke="#94a3b8" strokeWidth="1.5" />
                    {/* Axis Ticks */}
                    <text x="50" y={toY(max) + 4} textAnchor="end" fontSize="10" fill="#64748b">{max.toFixed(1)}</text>
                    <text x="50" y={toY(med) + 4} textAnchor="end" fontSize="10" fill="#0284c7" fontWeight="bold">{med.toFixed(1)}</text>
                    <text x="50" y={toY(min) + 4} textAnchor="end" fontSize="10" fill="#64748b">{min.toFixed(1)}</text>

                    {/* Whisker line */}
                    <line x1="150" y1={toY(lowerWhisker)} x2="150" y2={toY(upperWhisker)} stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Whisker caps */}
                    <line x1="130" y1={toY(upperWhisker)} x2="170" y2={toY(upperWhisker)} stroke="#334155" strokeWidth="2" />
                    <line x1="130" y1={toY(lowerWhisker)} x2="170" y2={toY(lowerWhisker)} stroke="#334155" strokeWidth="2" />

                    {/* Box IQR */}
                    <rect
                      x="110"
                      y={toY(q3)}
                      width="80"
                      height={Math.max(4, toY(q1) - toY(q3))}
                      fill="#e0f2fe"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />

                    {/* Median Line */}
                    <line x1="110" y1={toY(med)} x2="190" y2={toY(med)} stroke="#0369a1" strokeWidth="3" />

                    {/* Outliers */}
                    {outliers.map((out: number, idx: number) => (
                      <circle key={idx} cx="150" cy={toY(out)} r="3.5" fill="#ef4444" stroke="#991b1b" />
                    ))}

                    <text x="150" y="210" textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155">{xVar}</text>
                  </svg>
                );
              })()}
            </div>
          ) : (
            <Bar data={chartData} />
          )}
        </div>
      );
    }

    // 10. MEANS REPORT
    if (type === 'means_report') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {data.tables?.map((table: any, tIdx: number) => (
            <div key={tIdx} className="spss-pivot-table-wrapper">
              <div className="spss-pivot-title">Report: {table.dependent_variable} by {table.factor_variable}</div>
              <table className="spss-pivot-table">
                <thead>
                  <tr>
                    <th className="align-left">{table.factor_variable}</th>
                    <th>Mean</th>
                    <th>N</th>
                    <th>Std. Deviation</th>
                    <th>Std. Error</th>
                    <th>Median</th>
                    <th>Minimum</th>
                    <th>Maximum</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows?.map((r: any, rIdx: number) => (
                    <tr key={rIdx} className={r.group === 'Total' ? 'spss-pivot-total-row' : ''}>
                      <td className="align-left" style={{ fontWeight: r.group === 'Total' ? 700 : 500 }}>
                        {r.group}
                      </td>
                      <td>{r.mean}</td>
                      <td>{r.n}</td>
                      <td>{r.std_dev}</td>
                      <td>{r.se_mean}</td>
                      <td>{r.median}</td>
                      <td>{r.min}</td>
                      <td>{r.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }

    // 11. PARTIAL CORRELATIONS
    if (type === 'partial_correlation') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Correlations (Controlling for {data.control_variables?.join(', ')})</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Variable 1</th>
                <th className="align-left">Variable 2</th>
                <th>Partial Correlation (r)</th>
                <th>df</th>
                <th>Sig. (2-tailed)</th>
              </tr>
            </thead>
            <tbody>
              {data.rows?.map((r: any, rIdx: number) => (
                <tr key={rIdx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{r.var1}</td>
                  <td className="align-left">{r.var2}</td>
                  <td style={{ fontWeight: 600 }}>{r.correlation}</td>
                  <td>{r.df}</td>
                  <td style={{ color: r.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: r.sig < 0.05 ? 600 : 400 }}>
                    {r.sig < 0.001 ? '< .001' : r.sig}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">a. Cells contain zero-order (Pearson) correlations adjusted for control variables.</div>
        </div>
      );
    }

    // 12. CURVE ESTIMATION
    if (type === 'curve_estimation') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Model Description & Summary: {data.dependent_variable} vs {data.independent_variable}</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Model</th>
                <th>R Square</th>
                <th>Adjusted R²</th>
                <th>Std. Error</th>
                <th>F</th>
                <th>df1</th>
                <th>df2</th>
                <th>Sig.</th>
                <th>Constant (b0)</th>
                <th>b1</th>
              </tr>
            </thead>
            <tbody>
              {data.models?.map((m: any, mIdx: number) => (
                <tr key={mIdx}>
                  <td className="align-left" style={{ fontWeight: 600 }}>{m.model}</td>
                  <td>{m.r_square}</td>
                  <td>{m.adj_r_square}</td>
                  <td>{m.std_error}</td>
                  <td>{m.f}</td>
                  <td>{m.df1}</td>
                  <td>{m.df2}</td>
                  <td style={{ color: m.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: m.sig < 0.05 ? 600 : 400 }}>
                    {m.sig < 0.001 ? '< .001' : m.sig}
                  </td>
                  <td>{m.b0}</td>
                  <td>{m.b1}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="spss-pivot-notes">The dependent variable is {data.dependent_variable}. N = {data.n}.</div>
        </div>
      );
    }

    // 13. CHI-SQUARE GOODNESS OF FIT
    if (type === 'chi_square_goodness') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">{data.variable} Frequencies</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Category</th>
                  <th>Observed N</th>
                  <th>Expected N</th>
                  <th>Residual</th>
                </tr>
              </thead>
              <tbody>
                {data.frequencies?.map((f: any, i: number) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 500 }}>{f.category}</td>
                    <td>{f.observed}</td>
                    <td>{f.expected}</td>
                    <td>{f.residual}</td>
                  </tr>
                ))}
                <tr className="spss-pivot-total-row">
                  <td className="align-left">Total</td>
                  <td>{data.total_n}</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="spss-pivot-table-wrapper" style={{ maxWidth: 360 }}>
            <div className="spss-pivot-title">Test Statistics</div>
            <table className="spss-pivot-table">
              <tbody>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>Chi-Square</td>
                  <td>{data.test_statistics?.chi_square}</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>df</td>
                  <td>{data.test_statistics?.df}</td>
                </tr>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>Asymp. Sig.</td>
                  <td style={{ color: data.test_statistics?.asymp_sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>
                    {data.test_statistics?.asymp_sig < 0.001 ? '< .001' : data.test_statistics?.asymp_sig}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 14. BINOMIAL TEST
    if (type === 'binomial_test') {
      return (
        <div className="spss-pivot-table-wrapper">
          <div className="spss-pivot-title">Binomial Test: {data.variable}</div>
          <table className="spss-pivot-table">
            <thead>
              <tr>
                <th className="align-left">Category</th>
                <th>N</th>
                <th>Observed Prop.</th>
                <th>Test Prop.</th>
                <th>Exact Sig. (2-tailed)</th>
              </tr>
            </thead>
            <tbody>
              {data.groups?.map((g: any, i: number) => (
                <tr key={i}>
                  <td className="align-left">{g.category} (Group {g.group})</td>
                  <td>{g.n}</td>
                  <td>{g.observed_prop}</td>
                  <td>{g.test_prop !== null ? g.test_prop : ''}</td>
                  {i === 0 && <td rowSpan={2} style={{ verticalAlign: 'middle', fontWeight: 600 }}>{data.exact_sig_2tailed}</td>}
                </tr>
              ))}
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total</td>
                <td>{data.total_n}</td>
                <td>1.00</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 15. RUNS TEST
    if (type === 'runs_test') {
      return (
        <div className="spss-pivot-table-wrapper" style={{ maxWidth: 420 }}>
          <div className="spss-pivot-title">Runs Test: {data.variable}</div>
          <table className="spss-pivot-table">
            <tbody>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>Test Value (Cut Point)</td>
                <td>{data.test_value}</td>
              </tr>
              <tr>
                <td className="align-left">Cases &lt; Test Value</td>
                <td>{data.cases_less}</td>
              </tr>
              <tr>
                <td className="align-left">Cases &gt;= Test Value</td>
                <td>{data.cases_greater_equal}</td>
              </tr>
              <tr className="spss-pivot-total-row">
                <td className="align-left">Total Cases</td>
                <td>{data.total_cases}</td>
              </tr>
              <tr>
                <td className="align-left">Number of Runs</td>
                <td>{data.number_of_runs}</td>
              </tr>
              <tr>
                <td className="align-left">Z</td>
                <td>{data.z}</td>
              </tr>
              <tr>
                <td className="align-left" style={{ fontWeight: 600 }}>Asymp. Sig. (2-tailed)</td>
                <td style={{ color: data.asymp_sig_2tailed < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>
                  {data.asymp_sig_2tailed < 0.001 ? '< .001' : data.asymp_sig_2tailed}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // 16. ANCOVA (Analysis of Covariance)
    if (type === 'ancova') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tests of Between-Subjects Effects */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Tests of Between-Subjects Effects</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Source</th>
                  <th>Type III Sum of Squares</th>
                  <th>df</th>
                  <th>Mean Square</th>
                  <th>F</th>
                  <th>Sig.</th>
                  <th>Partial Eta Squared</th>
                </tr>
              </thead>
              <tbody>
                {data.tests_of_between_subjects?.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className={row.source === 'Corrected Total' ? 'spss-pivot-total-row' : ''}>
                    <td className="align-left" style={{ fontWeight: row.source === 'Corrected Model' || row.source === 'Corrected Total' ? 700 : 500 }}>
                      {row.source}
                    </td>
                    <td>{row.ss?.toLocaleString()}</td>
                    <td>{row.df}</td>
                    <td>{row.ms ? row.ms?.toLocaleString() : '-'}</td>
                    <td>{row.f !== null ? row.f : '-'}</td>
                    <td style={{ color: row.sig !== null && row.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: row.sig !== null && row.sig < 0.05 ? 700 : 400 }}>
                      {row.sig !== null ? (row.sig < 0.001 ? '< .001' : row.sig) : '-'}
                    </td>
                    <td>{row.eta_sq !== null ? row.eta_sq : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="spss-pivot-notes">
              a. Dependent Variable: {data.dependent_variable}. R Squared = {data.tests_of_between_subjects?.[0]?.eta_sq}
            </div>
          </div>

          {/* Estimated Marginal Means */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Estimated Marginal Means: {data.factor_variable}</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">{data.factor_variable}</th>
                  <th>N</th>
                  <th>Observed Mean</th>
                  <th>Adjusted Mean</th>
                  <th>Std. Error</th>
                  <th colSpan={2}>95% Confidence Interval</th>
                </tr>
                <tr>
                  <th colSpan={5}></th>
                  <th>Lower Bound</th>
                  <th>Upper Bound</th>
                </tr>
              </thead>
              <tbody>
                {data.estimated_marginal_means?.map((g: any, gIdx: number) => (
                  <tr key={gIdx}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{g.level}</td>
                    <td>{g.n}</td>
                    <td>{g.raw_mean}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{g.adjusted_mean}</td>
                    <td>{g.std_error}</td>
                    <td>{g.ci_lower}</td>
                    <td>{g.ci_upper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="spss-pivot-notes">
              a. Covariates appearing in the model are evaluated at the following values: {data.covariate_evaluated_at?.variable} = {data.covariate_evaluated_at?.mean}.
            </div>
          </div>
        </div>
      );
    }

    // 17. K-MEANS CLUSTER
    if (type === 'kmeans_cluster') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Final Cluster Centers */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Final Cluster Centers</div>
            <table className="spss-pivot-table">
              <thead>
                <tr>
                  <th className="align-left">Variable</th>
                  {Array.from({ length: data.k || 3 }).map((_, c) => (
                    <th key={c}>Cluster {c + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.final_cluster_centers?.map((row: any, rIdx: number) => (
                  <tr key={rIdx}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{row.variable}</td>
                    {Array.from({ length: data.k || 3 }).map((_, c) => (
                      <td key={c} style={{ fontWeight: 600 }}>{row[`Cluster ${c + 1}`]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Number of Cases in Each Cluster */}
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Number of Cases in each Cluster</div>
            <table className="spss-pivot-table" style={{ maxWidth: 440 }}>
              <thead>
                <tr>
                  <th className="align-left">Cluster</th>
                  <th>Frequency (Cases)</th>
                  <th>Percent</th>
                </tr>
              </thead>
              <tbody>
                {data.cluster_counts?.map((c: any, cIdx: number) => (
                  <tr key={cIdx}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{c.cluster}</td>
                    <td>{c.count}</td>
                    <td>{c.percent}%</td>
                  </tr>
                ))}
                <tr className="spss-pivot-total-row">
                  <td className="align-left">Valid Total</td>
                  <td>{data.total_cases}</td>
                  <td>100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ANOVA Table */}
          {data.anova && (
            <div className="spss-pivot-table-wrapper">
              <div className="spss-pivot-title">ANOVA (Between vs Within Clusters)</div>
              <table className="spss-pivot-table">
                <thead>
                  <tr>
                    <th className="align-left">Variable</th>
                    <th>Cluster Mean Square</th>
                    <th>df</th>
                    <th>Error Mean Square</th>
                    <th>df</th>
                    <th>F</th>
                    <th>Sig.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.anova.map((a: any, aIdx: number) => (
                    <tr key={aIdx}>
                      <td className="align-left" style={{ fontWeight: 600 }}>{a.variable}</td>
                      <td>{a.cluster_ms}</td>
                      <td>{a.cluster_df}</td>
                      <td>{a.error_ms}</td>
                      <td>{a.error_df}</td>
                      <td>{a.f}</td>
                      <td style={{ color: a.sig < 0.05 ? 'var(--accent)' : 'inherit', fontWeight: 600 }}>
                        {a.sig < 0.001 ? '< .001' : a.sig}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="spss-pivot-notes">The F tests should be used only for descriptive purposes since the clusters have been chosen to maximize the differences among cases in different clusters.</div>
            </div>
          )}
        </div>
      );
    }

    // 18. HISTOGRAM WITH NORMAL CURVE
    if (type === 'histogram_curve') {
      return <HistogramItemView data={data} title={item.title} />;
    }

    // 19. SCATTER PLOT WITH REGRESSION LINE
    if (type === 'scatter_regression') {
      return <ScatterRegressionItemView data={data} title={item.title} />;
    }

    // 20. AUTHENTIC SPSS BOXPLOT CHART
    if (type === 'boxplot_chart') {
      return <BoxplotItemView data={data} title={item.title} />;
    }

    // 21. AUTHENTIC SPSS NORMAL Q-Q PLOT
    if (type === 'qqplot_chart') {
      return <QQPlotItemView data={data} title={item.title} />;
    }

    // 22. COUNT VALUES WITHIN CASES
    if (type === 'count_values') {
      const { targetVar, sourceVars = [], condition, casesCounted } = data;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Count Values within Cases: {targetVar}</div>
            <table className="spss-pivot-table" style={{ maxWidth: 500 }}>
              <thead>
                <tr>
                  <th className="align-left">Target Variable</th>
                  <th>Source Variables</th>
                  <th>Count Condition</th>
                  <th>Cases Processed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left" style={{ fontWeight: 600 }}>{targetVar}</td>
                  <td>{sourceVars.join(', ')}</td>
                  <td>{condition}</td>
                  <td>{casesCounted}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 23. RANK CASES
    if (type === 'rank_cases') {
      const { direction, tiesMethod, summaries = [] } = data;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">Rank Cases Summary</div>
            <table className="spss-pivot-table" style={{ maxWidth: 600 }}>
              <thead>
                <tr>
                  <th className="align-left">Original Variable</th>
                  <th>Rank Variable</th>
                  <th>Direction</th>
                  <th>Ties Method</th>
                  <th>N</th>
                  <th>Tied Cases</th>
                  <th>Min Rank</th>
                  <th>Max Rank</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{s.originalVar}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{s.rankVar}</td>
                    <td>{direction}</td>
                    <td>{tiesMethod}</td>
                    <td>{s.n}</td>
                    <td>{s.ties}</td>
                    <td>{s.minRank}</td>
                    <td>{s.maxRank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 35. REPEATED MEASURES ANOVA
    if (type === 'repeated_measures_anova') {
      return <RepeatedMeasuresItemView data={data} />;
    }

    // 36. FRIEDMAN TEST
    if (type === 'friedman_test') {
      return <FriedmanItemView data={data} />;
    }

    // 37. ORDINAL LOGISTIC REGRESSION
    if (type === 'ordinal_regression') {
      return <OrdinalRegressionItemView data={data} />;
    }

    // 38. KAPLAN-MEIER SURVIVAL ANALYSIS
    if (type === 'kaplan_meier') {
      return <KaplanMeierItemView data={data} title={item.title} />;
    }

    // Generic Fallback Table for custom output data
    if (data && typeof data === 'object') {
      const entries = Object.entries(data).filter(([k]) => k !== 'title');
      if (entries.length > 0) {
        return (
          <div className="spss-pivot-table-wrapper">
            <div className="spss-pivot-title">{data.title || item.title}</div>
            <table className="spss-pivot-table">
              <tbody>
                {entries.map(([k, v], i) => (
                  <tr key={i}>
                    <td className="align-left" style={{ fontWeight: 600 }}>{k.replace(/_/g, ' ')}</td>
                    <td>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="spss-output-container">
      {/* Left Pane: Hierarchical Navigation Tree */}
      <div className="spss-output-tree-pane">
        <div className="spss-output-tree-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} /> Output Outline
          </div>
        </div>
        <div className="spss-output-tree-list">
          <div className="spss-tree-node level-0" style={{ fontWeight: 600 }}>
            <span>📁</span> Output Document
          </div>
          {outputs.map((item) => {
            const isChart = ['chart', 'histogram_curve', 'scatter_regression', 'boxplot_chart', 'qqplot_chart', 'kaplan_meier'].includes(item.type);
            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Top Node */}
                <div
                  className="spss-tree-node level-1"
                  onClick={() => scrollToItem(item.id)}
                >
                  <span>{isChart ? '📊' : '📋'}</span>
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                </div>
                {/* Sub items */}
                <div className="spss-tree-node level-2" onClick={() => scrollToItem(item.id)}>
                  <FileText size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Log</span>
                </div>
                <div className="spss-tree-node level-2" onClick={() => scrollToItem(item.id)}>
                  {isChart ? <BarChart2 size={12} color="var(--accent)" /> : <TableIcon size={12} color="var(--accent)" />}
                  <span style={{ fontSize: 11 }}>{isChart ? 'Chart' : 'Pivot Table'}</span>
                </div>
              </div>
            );
          })}
          {outputs.length === 0 && (
            <div style={{ padding: 16, fontSize: 11, color: 'var(--text-dim)', fontStyle: 'italic' }}>
              No output entries. Run any statistical test from Analyze menu.
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Report Document */}
      <div className="spss-output-doc-pane">
        {/* Output Toolbar */}
        <div className="spss-output-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="spss-btn" onClick={() => onExport('pdf')} title="Export Full Report as PDF">
              <Download size={13} /> Export PDF
            </button>
            <button className="spss-btn" onClick={() => onExport('word')} title="Export Report as Microsoft Word (.doc)">
              <FileText size={13} /> Export Word
            </button>
            <button className="spss-btn" onClick={() => onExport('xlsx')} title="Export Data & Tables as Excel">
              <FileSpreadsheet size={13} /> Export Excel
            </button>
            <button className="spss-btn" onClick={() => window.print()} title="Print">
              <Printer size={13} /> Print
            </button>
          </div>
          <div>
            <button className="spss-btn spss-btn-danger" onClick={onClearOutputs} disabled={outputs.length === 0}>
              <Trash2 size={13} /> Clear Output
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="spss-output-doc-scroll">
          {outputs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Layers size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-main)' }}>No Statistical Output Generated Yet</h3>
              <p style={{ fontSize: 12, maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
                Open an analysis from the <strong>Analyze</strong> menu above (e.g. <em>Analyze → Descriptive Statistics → Frequencies</em> or <em>Compare Means → One-Way ANOVA</em>) to produce SPSS statistical tables and figures.
              </p>
            </div>
          ) : (
            outputs.map((item) => (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[item.id] = el;
                }}
                className="spss-output-item-card"
              >
                {/* Title & Actions */}
                <div className="spss-output-item-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                    onClick={() => toggleCollapse(item.id)}
                    title={collapsedItems[item.id] ? 'Expand' : 'Collapse'}
                  >
                    {collapsedItems[item.id] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {['chart', 'histogram_curve', 'scatter_regression', 'boxplot_chart', 'qqplot_chart', 'kaplan_meier'].includes(item.type) ? (
                    <BarChart2 size={16} color="var(--accent)" />
                  ) : (
                    <TableIcon size={16} color="var(--accent)" />
                  )}
                  <span style={{ fontWeight: 600 }}>{item.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                    {item.timestamp}
                  </span>

                  {/* Copy Table Button */}
                  <button
                    className="spss-btn"
                    style={{ padding: '2px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleCopyTable(item.id)}
                    title="Copy table to clipboard (TSV for Excel / Word)"
                  >
                    {copiedId === item.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy Table'}</span>
                  </button>

                  {/* Delete Item Button */}
                  {onDeleteOutputItem && (
                    <button
                      className="spss-btn spss-btn-danger"
                      style={{ padding: '2px 6px', display: 'flex', alignItems: 'center' }}
                      onClick={() => onDeleteOutputItem(item.id)}
                      title="Delete this output"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Collapsible Body */}
                {!collapsedItems[item.id] && (
                  <>
                    {/* Syntax Log Box */}
                    {item.syntax && (
                      <div className="spss-syntax-log-block">
                        {item.syntax}
                      </div>
                    )}

                    {/* Standard IBM SPSS Collapsible Notes Table */}
                    <SPSSNotesTable item={item} />

                    {/* Pivot Table / Visualization */}
                    {renderPivotContent(item)}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
