/**
 * DynamoDB Article Repository Implementation
 */

import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  type QueryCommandInput,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { NotFoundError, type Result, ValidationError, err, ok } from '../../core/result';
import type { Article } from '../../domain/articles/article.entity';
import type {
  ArticleRepository,
  FindArticlesResult,
  FindByUserIdOptions,
  PaginationOptions,
} from '../../domain/articles/article.repository';
import type { ArticleId, Category, PriorityScore, UserId } from '../../domain/types';

export class DynamoDBArticleRepository implements ArticleRepository {
  private client: DynamoDBClient;
  private tableName: string;

  constructor(config?: { endpoint?: string; region?: string; tableName?: string }) {
    this.client = new DynamoDBClient({
      endpoint: config?.endpoint || process.env.DYNAMODB_ENDPOINT,
      region: config?.region || process.env.AWS_REGION || 'ap-northeast-1',
      ...(config?.endpoint && {
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }),
    });
    this.tableName = config?.tableName || process.env.ARTICLES_TABLE || 'siftr-articles';
  }

  async findById(
    articleId: ArticleId
  ): Promise<Result<Article | null, ValidationError | NotFoundError>> {
    try {
      // Query by article_id (partition key)
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'article_id = :articleId',
          ExpressionAttributeValues: marshall({
            ':articleId': articleId,
          }),
          Limit: 1,
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return ok(null);
      }

      // Type narrowing: result.Items[0] is guaranteed to exist here
      const firstItem = result.Items[0];
      if (!firstItem) {
        return ok(null);
      }

      const item = unmarshall(firstItem);
      const article = this.fromDBItem(item);
      return ok(article);
    } catch (error) {
      console.error('DynamoDB findById error:', error);
      return err(
        new ValidationError(
          `記事の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async findByUserId(
    userId: UserId,
    options?: FindByUserIdOptions
  ): Promise<Result<Article[], ValidationError>> {
    try {
      const limit = options?.limit || 100;

      // Use UserCategoryIndex
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'UserCategoryIndex',
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        Limit: limit,
        ScanIndexForward: options?.sortOrder === 'asc',
      };

      // Add cursor for pagination
      if (options?.cursor) {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(options.cursor, 'base64').toString('utf-8')
        );
      }

      // Build filter expressions
      const filterParts: string[] = [];
      const attrValues: Record<string, string | number> = { ':userId': userId };

      if (options?.category) {
        filterParts.push('category = :category');
        attrValues[':category'] = options.category;
      }

      if (options?.priorityMin !== undefined) {
        filterParts.push('priority_score >= :priorityMin');
        attrValues[':priorityMin'] = options.priorityMin;
      }

      if (options?.priorityMax !== undefined) {
        filterParts.push('priority_score <= :priorityMax');
        attrValues[':priorityMax'] = options.priorityMax;
      }

      if (filterParts.length > 0) {
        params.FilterExpression = filterParts.join(' AND ');
        params.ExpressionAttributeValues = marshall(attrValues);
      }

      const result = await this.client.send(new QueryCommand(params));

      const articles = (result.Items || []).map((item) => this.fromDBItem(unmarshall(item)));

      // Sort if needed
      if (options?.sortBy) {
        articles.sort((a, b) => {
          let aValue: number;
          let bValue: number;

          switch (options.sortBy) {
            case 'priorityScore':
              aValue = a.priorityScore;
              bValue = b.priorityScore;
              break;
            case 'trendingScore':
              aValue = a.trendingScore;
              bValue = b.trendingScore;
              break;
            default:
              aValue = a.collectedAt;
              bValue = b.collectedAt;
              break;
          }

          return options.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }

      return ok(articles);
    } catch (error) {
      console.error('DynamoDB findByUserId error:', error);
      return err(
        new ValidationError(
          `ユーザーの記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async findByUserIdAndCategory(
    userId: UserId,
    category: Category,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>> {
    try {
      const limit = options?.limit || 20;

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'UserCategoryIndex',
        KeyConditionExpression: 'user_id = :userId',
        FilterExpression: 'category = :category',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':category': category,
        }),
        Limit: limit + 1, // Fetch one extra to check if there are more
        ScanIndexForward: false,
      };

      if (options?.cursor) {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(options.cursor, 'base64').toString('utf-8')
        );
      }

      const result = await this.client.send(new QueryCommand(params));

      const items = result.Items || [];
      const hasMore = items.length > limit;
      const articles = items.slice(0, limit).map((item) => this.fromDBItem(unmarshall(item)));

      const nextCursor =
        hasMore && result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined;

      return ok({
        articles,
        cursor: nextCursor,
        hasMore,
      });
    } catch (error) {
      console.error('DynamoDB findByUserIdAndCategory error:', error);
      return err(
        new ValidationError(
          `カテゴリ別記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async findByUserIdAndPriorityRange(
    userId: UserId,
    priorityMin: number,
    priorityMax: number,
    options?: PaginationOptions
  ): Promise<Result<FindArticlesResult, ValidationError>> {
    try {
      const limit = options?.limit || 20;

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'UserPriorityIndex',
        KeyConditionExpression:
          'user_id = :userId AND priority_score BETWEEN :priorityMin AND :priorityMax',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
          ':priorityMin': priorityMin,
          ':priorityMax': priorityMax,
        }),
        Limit: limit + 1,
        ScanIndexForward: false,
      };

      if (options?.cursor) {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(options.cursor, 'base64').toString('utf-8')
        );
      }

      const result = await this.client.send(new QueryCommand(params));

      const items = result.Items || [];
      const hasMore = items.length > limit;
      const articles = items.slice(0, limit).map((item) => this.fromDBItem(unmarshall(item)));

      const nextCursor =
        hasMore && result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined;

      return ok({
        articles,
        cursor: nextCursor,
        hasMore,
      });
    } catch (error) {
      console.error('DynamoDB findByUserIdAndPriorityRange error:', error);
      return err(
        new ValidationError(
          `優先度別記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async findByUserIdAndDateRange(
    userId: UserId,
    dateFrom: number,
    dateTo: number
  ): Promise<Result<Article[], ValidationError>> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'UserCategoryIndex',
          KeyConditionExpression: 'user_id = :userId',
          FilterExpression: 'collected_at BETWEEN :dateFrom AND :dateTo',
          ExpressionAttributeValues: marshall({
            ':userId': userId,
            ':dateFrom': dateFrom,
            ':dateTo': dateTo,
          }),
        })
      );

      const articles = (result.Items || []).map((item) => this.fromDBItem(unmarshall(item)));
      return ok(articles);
    } catch (error) {
      console.error('DynamoDB findByUserIdAndDateRange error:', error);
      return err(
        new ValidationError(
          `期間別記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async findAll(): Promise<Result<Article[], ValidationError>> {
    try {
      const result = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
        })
      );

      const articles = (result.Items || []).map((item) => this.fromDBItem(unmarshall(item)));
      return ok(articles);
    } catch (error) {
      console.error('DynamoDB findAll error:', error);
      return err(
        new ValidationError(
          `全記事取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async save(article: Article): Promise<Result<void, ValidationError>> {
    try {
      const item = this.toDBItem(article);

      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(item, { removeUndefinedValues: true }),
        })
      );

      return ok(undefined);
    } catch (error) {
      console.error('DynamoDB save error:', error);
      return err(
        new ValidationError(
          `記事の保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async delete(articleId: ArticleId): Promise<Result<void, ValidationError | NotFoundError>> {
    try {
      // First, find the article to get the sort key
      const findResult = await this.findById(articleId);
      if (!findResult.ok) return findResult;
      if (!findResult.value) {
        return err(new NotFoundError('記事', articleId));
      }

      await this.client.send(
        new DeleteItemCommand({
          TableName: this.tableName,
          Key: marshall({
            article_id: articleId,
            collected_at: findResult.value.collectedAt,
          }),
        })
      );

      return ok(undefined);
    } catch (error) {
      console.error('DynamoDB delete error:', error);
      return err(
        new ValidationError(
          `記事の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async exists(articleId: ArticleId): Promise<Result<boolean, ValidationError>> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: 'article_id = :articleId',
          ExpressionAttributeValues: marshall({
            ':articleId': articleId,
          }),
          Limit: 1,
          Select: 'COUNT',
        })
      );

      return ok((result.Count || 0) > 0);
    } catch (error) {
      console.error('DynamoDB exists error:', error);
      return err(
        new ValidationError(
          `記事存在確認に失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  async countByUserId(userId: UserId): Promise<Result<number, ValidationError>> {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'UserCategoryIndex',
          KeyConditionExpression: 'user_id = :userId',
          ExpressionAttributeValues: marshall({
            ':userId': userId,
          }),
          Select: 'COUNT',
        })
      );

      return ok(result.Count || 0);
    } catch (error) {
      console.error('DynamoDB countByUserId error:', error);
      return err(
        new ValidationError(
          `記事数カウントに失敗しました: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  // Mapping helpers
  private toDBItem(article: Article): Record<string, unknown> {
    return {
      article_id: article.articleId,
      user_id: article.userId,
      collected_at: article.collectedAt,
      ttl: article.ttl,
      source_id: article.sourceId,
      source_type: article.sourceType,
      url: article.url,
      title: article.title,
      author: article.author,
      published_at: article.publishedAt,
      content_preview: article.contentPreview,
      content_s3_key: article.contentS3Key,
      image_url: article.imageUrl,
      language: article.language,
      category: article.category,
      subcategories: Array.from(article.subcategories),
      technical_level: article.technicalLevel,
      priority_score: article.priorityScore,
      trending_score: article.trendingScore,
      summary_short: article.summaryShort,
      summary_detailed: article.summaryDetailed,
      key_points: Array.from(article.keyPoints),
      keywords: Array.from(article.keywords),
      recommendation_tag: article.recommendationTag,
      ai_provider: article.aiProvider,
      ai_model: article.aiModel,
      analyzed_at: article.analyzedAt,
      analysis_version: article.analysisVersion,
    };
  }

  private fromDBItem(item: Record<string, unknown>): Article {
    return {
      articleId: item.article_id as ArticleId,
      userId: item.user_id as UserId,
      collectedAt: item.collected_at as number,
      ttl: item.ttl as number,
      sourceId: item.source_id as string,
      sourceType: item.source_type as Article['sourceType'],
      url: item.url as string,
      title: item.title as string,
      author: item.author as string | undefined,
      publishedAt: item.published_at as number | undefined,
      contentPreview: item.content_preview as string,
      contentS3Key: item.content_s3_key as string | undefined,
      imageUrl: item.image_url as string | undefined,
      language: item.language as Article['language'],
      category: item.category as Category,
      subcategories: (item.subcategories as string[]) || [],
      technicalLevel: item.technical_level as Article['technicalLevel'],
      priorityScore: item.priority_score as PriorityScore,
      trendingScore: item.trending_score as number,
      summaryShort: (item.summary_short as string) || '',
      summaryDetailed: (item.summary_detailed as string) || '',
      keyPoints: (item.key_points as string[]) || [],
      keywords: (item.keywords as string[]) || [],
      recommendationTag: item.recommendation_tag as Article['recommendationTag'],
      aiProvider: item.ai_provider as Article['aiProvider'],
      aiModel: item.ai_model as string | undefined,
      analyzedAt: item.analyzed_at as number | undefined,
      analysisVersion: item.analysis_version as string | undefined,
    };
  }
}
