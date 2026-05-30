export interface TableInfo {
  name: string;
  type: 'table' | 'view';
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string | null;
}

export interface IndexInfo {
  name: string;
  tableName: string;
  columns: string[];
  unique: boolean;
}

export interface SchemaInfo {
  tables: TableInfo[];
  views: TableInfo[];
  indexes: IndexInfo[];
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
}
