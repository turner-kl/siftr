import type { Article } from "@/types/article";

export const mockArticles: readonly Article[] = [
  {
    id: "1",
    title: "Next.js 15の新機能とパフォーマンス改善について",
    url: "https://example.com/nextjs-15",
    source: "Zenn",
    category: "tech",
    priority: "must-read",
    level: "intermediate",
    publishedAt: new Date("2025-10-04"),
    summary: {
      brief:
        "Next.js 15のServer ActionsとPartial Prerenderingの実装方法を解説。パフォーマンスが平均30%向上。",
      detailed:
        "Next.js 15で導入された新機能について詳しく解説します。特にServer Actionsの実装パターンとPartial Prerenderingによるレンダリング最適化に焦点を当てています。実際のベンチマーク結果では、従来のバージョンと比較して初期ロード時間が30%短縮されました。また、開発者体験の向上を目的とした新しいデバッグツールについても紹介しています。",
    },
    tags: ["Next.js", "React", "パフォーマンス", "SSR"],
    trendScore: 95,
    importance: 90,
    isRead: false,
  },
  {
    id: "2",
    title: "グローバル人材マネジメントのトレンド2025",
    url: "https://example.com/hr-trends-2025",
    source: "note",
    category: "hr",
    priority: "recommended",
    level: "intermediate",
    publishedAt: new Date("2025-10-03"),
    summary: {
      brief:
        "リモートワークの定着に伴う人材評価制度の変革。成果主義とウェルビーイングのバランスが重要に。",
      detailed:
        "2025年のグローバル人材マネジメントにおいて、リモートワークが完全に定着した環境での新しい評価制度が注目されています。従来の時間ベースの評価から成果ベースへのシフトが加速する一方、従業員のウェルビーイングを重視する企業が増加しています。Deloitteの最新調査では、73%の企業がハイブリッド評価モデルを導入予定であることが明らかになりました。",
    },
    tags: ["人事制度", "リモートワーク", "評価制度", "ウェルビーイング"],
    trendScore: 85,
    importance: 80,
    isRead: false,
  },
  {
    id: "3",
    title: "TypeScript 5.7の型システム強化とベストプラクティス",
    url: "https://example.com/typescript-5.7",
    source: "Qiita",
    category: "tech",
    priority: "recommended",
    level: "advanced",
    publishedAt: new Date("2025-10-02"),
    summary: {
      brief:
        "TypeScript 5.7の新しい型推論機能とNever型の改善。大規模プロジェクトでの型安全性が向上。",
      detailed:
        "TypeScript 5.7では型システムに大幅な改善が加えられました。特に、条件付き型の推論能力が強化され、より複雑な型パターンを正確に推論できるようになりました。Never型の扱いも改善され、エッジケースでの型エラーが減少しています。また、新しいutility typeが追加され、日常的な型操作がより簡潔に記述できるようになりました。",
    },
    tags: ["TypeScript", "型システム", "型安全性"],
    trendScore: 75,
    importance: 70,
    isRead: true,
  },
  {
    id: "4",
    title: "AI時代のビジネスモデル変革：生成AIの実践的活用法",
    url: "https://example.com/ai-business-model",
    source: "企業テックブログ",
    category: "business",
    priority: "must-read",
    level: "beginner",
    publishedAt: new Date("2025-10-01"),
    summary: {
      brief:
        "生成AIを活用した業務効率化の具体事例。導入初期で50%のコスト削減に成功した企業も。",
      detailed:
        "生成AIをビジネスに実装した企業の成功事例を紹介します。カスタマーサポートの自動化、コンテンツ生成、データ分析など、様々な領域での活用方法を解説。特に中小企業でも導入可能な低コストソリューションに焦点を当てています。実際の導入プロセスと、ROIを最大化するためのベストプラクティスも詳しく説明しています。",
    },
    tags: ["生成AI", "ビジネスモデル", "DX", "コスト削減"],
    trendScore: 92,
    importance: 95,
    isRead: false,
  },
  {
    id: "5",
    title: "React Server Componentsの深い理解と実装パターン",
    url: "https://example.com/rsc-deep-dive",
    source: "Dev.to",
    category: "tech",
    priority: "recommended",
    level: "advanced",
    publishedAt: new Date("2025-09-30"),
    summary: {
      brief:
        "RSCの内部動作とクライアント・サーバーコンポーネントの使い分け方。実践的なデザインパターンを紹介。",
      detailed:
        "React Server Components (RSC)の仕組みを詳しく解説します。従来のSSRとの違い、ストリーミングレンダリングの実装方法、パフォーマンス最適化のテクニックなどを網羅的に説明。特に、クライアントコンポーネントとサーバーコンポーネントの境界設計について、実際のプロジェクトで得られた知見を共有しています。",
    },
    tags: ["React", "RSC", "サーバーコンポーネント", "アーキテクチャ"],
    trendScore: 88,
    importance: 85,
    isRead: false,
  },
  {
    id: "6",
    title: "タレントマネジメントシステムの選び方と導入事例",
    url: "https://example.com/talent-management",
    source: "note",
    category: "hr",
    priority: "reference",
    level: "beginner",
    publishedAt: new Date("2025-09-29"),
    summary: {
      brief:
        "最新のタレントマネジメントシステムの機能比較。中堅企業での導入ポイントを解説。",
      detailed:
        "タレントマネジメントシステムの選定基準と導入時の注意点について解説します。主要なプロバイダーの機能比較、価格帯、導入に必要な期間などを詳しく説明。特に、従業員500名規模の企業での導入事例を紹介し、実際に直面した課題とその解決方法について共有しています。",
    },
    tags: ["タレントマネジメント", "HRテック", "人材育成"],
    trendScore: 60,
    importance: 55,
    isRead: false,
  },
  {
    id: "7",
    title: "Web開発のためのDocker完全ガイド2025",
    url: "https://example.com/docker-guide",
    source: "Zenn",
    category: "tech",
    priority: "reference",
    level: "beginner",
    publishedAt: new Date("2025-09-28"),
    summary: {
      brief:
        "Dockerの基礎からマルチステージビルド、開発環境の構築まで。初心者向けの実践ガイド。",
      detailed:
        "Web開発におけるDockerの活用方法を初心者向けに解説します。基本的なコンテナの概念から、docker-composeを使った複数サービスの管理、本番環境へのデプロイまでカバーしています。実際のNext.jsプロジェクトを例に、開発環境のセットアップ手順を詳しく説明しています。",
    },
    tags: ["Docker", "コンテナ", "開発環境", "DevOps"],
    trendScore: 70,
    importance: 65,
    isRead: true,
  },
  {
    id: "8",
    title: "エンゲージメント向上のための組織文化デザイン",
    url: "https://example.com/engagement-culture",
    source: "note",
    category: "hr",
    priority: "must-read",
    level: "intermediate",
    publishedAt: new Date("2025-09-27"),
    summary: {
      brief:
        "心理的安全性とエンゲージメントの関係性。実践的な組織文化改革の手法を紹介。",
      detailed:
        "従業員エンゲージメントを高める組織文化の構築方法について解説します。Googleのリサーチに基づく心理的安全性の重要性、1on1ミーティングの効果的な運用方法、フィードバック文化の醸成などを詳しく説明。実際に大手IT企業で実施された文化改革プロジェクトの成功事例も紹介しています。",
    },
    tags: ["組織文化", "エンゲージメント", "心理的安全性", "1on1"],
    trendScore: 82,
    importance: 88,
    isRead: false,
  },
] as const;
