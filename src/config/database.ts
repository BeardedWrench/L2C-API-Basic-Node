import { Pool, PoolClient, QueryResult } from 'pg';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool;

  private config = {
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'basic_crud_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  private constructor() {
    this.pool = new Pool(this.config);
    this.setupEventListeners();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public static async initialize(): Promise<void> {
    const instance = DatabaseConnection.getInstance();
    await instance.testConnection();
  }

  private setupEventListeners(): void {
    this.pool.on('connect', (client: PoolClient) => {
      console.log('New Client connected to the database');
    });
    this.pool.on('remove', (client: PoolClient) => {
      console.log('Client removed from the database pool');
    });
    this.pool.on('error', (err: Error, client: PoolClient) => {
      console.log(`Unexpected error on idle client: ${err}`);
    });
  }

  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      console.log('Database connection test successful');
      console.log(`Connected to PostgreSQL at: ${result.rows[0].now}`);
    } catch (error) {
      console.log(`Database connected test failed: ${error}`);
      throw error;
    }
  }

  public async query(text: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`Query executed in ${duration}ms`);

      return result;
    } catch (error) {
      console.log(`Database query error: ${error}`);
      console.log(`Failed query: ${text}`);
      console.log(`Query parameters: ${JSON.stringify(params)}`);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async beginTransaction(client: PoolClient): Promise<void> {
    await client.query('BEGIN');
  }

  public async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
  }

  public async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
  }

  public static async close(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.pool.end();
      console.log('Database connection pool close');
    }
  }

  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}
