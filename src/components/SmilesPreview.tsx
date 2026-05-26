import { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';

interface Props {
  smiles: string;
  compact?: boolean;
}

export function SmilesPreview({ smiles, compact = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  const width = compact ? 140 : 360;
  const height = compact ? 90 : 260;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);
    setError('');
    if (!smiles.trim()) return;
    const drawer = new SmilesDrawer.Drawer({ width, height });
    SmilesDrawer.parse(
      smiles,
      (tree: unknown) => drawer.draw(tree, canvas, 'light', false),
      (message: string) => setError(`SMILES 无效：${message}`)
    );
  }, [smiles, width, height]);

  return (
    <div className={compact ? 'smiles-preview compact' : 'smiles-preview'}>
      {!compact && <h4>SMILES 2D Preview</h4>}
      <canvas ref={canvasRef} width={width} height={height} />
      {error && !compact && <p className="error-text">{error}</p>}
      {!smiles && !compact && <p className="hint">{'\u8bf7\u5148\u586b\u5199 canonical_smiles \u4ee5\u751f\u6210 2D \u7ed3\u6784\u9884\u89c8'}</p>}
    </div>
  );
}
