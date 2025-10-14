# 実装変更履歴

## Lambda Web Adapter: Docker → ZIP Package + ARM64

### 変更理由

ユーザーからのフィードバックにより、以下の最適化を実施：

1. **Dockerイメージ不要化**: ZIPパッケージデプロイメントに変更
2. **ARM64アーキテクチャ採用**: コスト削減（x86_64の約20%削減）

### 変更内容

#### Before（Dockerイメージ）
```typescript
// DockerImageFunction を使用
const dockerImage = new ecr_assets.DockerImageAsset(this, 'ApiImage', {
  directory: path.join(__dirname, '../../../backend'),
  file: 'Dockerfile',
  platform: ecr_assets.Platform.LINUX_AMD64,
});

this.apiFunction = new lambda.DockerImageFunction(this, 'ApiFunction', {
  code: lambda.DockerImageCode.fromEcr(dockerImage.repository, {
    tagOrDigest: dockerImage.imageTag,
  }),
  // ...
});
```

#### After（ZIPパッケージ + ARM64）
```typescript
// Lambda Web Adapter Layer を使用
const lambdaAdapterLayerArn =
  `arn:aws:lambda:${region}:753240598075:layer:LambdaAdapterLayerArm64:25`;

this.apiFunction = new lambda.Function(this, 'ApiFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'run.sh',
  architecture: lambda.Architecture.ARM_64,  // ARM64
  layers: [lambdaAdapterLayer],
  environment: {
    AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',  // 必須
    AWS_LWA_INVOKE_MODE: 'response_stream',
    // ...
  },
});
```

### メリット

| 項目 | Dockerイメージ | ZIPパッケージ + ARM64 |
|------|---------------|----------------------|
| **デプロイ速度** | 遅い（数分） | 速い（数十秒） |
| **コールドスタート** | ~3秒 | ~1秒 |
| **コスト** | ECRストレージ + x86_64 | ストレージ無料 + ARM64（20%削減） |
| **管理** | ECRレジストリ管理必要 | 不要 |
| **サイズ制限** | 10GB | 250MB |

### コスト削減効果

**月間実行時間: 100万ミリ秒（約16.7分）の場合**

- x86_64: $0.0000166667 × 100万 = **$16.67**
- ARM64: $0.0000133334 × 100万 = **$13.33**
- **節約額: $3.34/月（20%削減）**

リクエスト数が増えるほど効果が大きくなります。

### 追加・削除ファイル

**追加**:
1. **run.sh**: Lambda Web Adapter起動スクリプト
   ```bash
   #!/bin/bash
   exec node index.js
   ```

2. **esbuild.config.mjs**: ビルド設定の改善
   - run.sh, package.json を dist/api にコピー
   - Lambda デプロイ用の構成

**削除**:
- **Dockerfile**（本番用）: ZIPパッケージデプロイメントに変更したため不要
- **Dockerfile.dev**は残す（ローカル開発用Docker Compose環境で使用）

### CDK構造の改善

ユーザーからのフィードバックにより、CDKディレクトリ構造をベストプラクティスに準拠：

#### Before
```
cdk/
└── infrastructure/
    ├── app.ts
    ├── stacks/
    └── constructs/
```

#### After（ベストプラクティス）
```
cdk/
├── bin/
│   └── app.ts          # エントリーポイント
├── lib/
│   ├── stacks/         # スタック定義
│   └── constructs/     # 再利用可能なコンストラクト
└── test/               # CDKテスト
```

この構造は AWS CDK 公式ドキュメントの推奨構造です。

### 参考

- [Lambda Web Adapter - ZIP Package Example](https://github.com/awslabs/aws-lambda-web-adapter/tree/main/examples/expressjs-zip)
- [Lambda ARM64 Pricing](https://aws.amazon.com/lambda/pricing/)
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
