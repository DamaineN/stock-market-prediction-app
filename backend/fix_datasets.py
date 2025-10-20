#!/usr/bin/env python3
"""
Quick fix for dataset format
Converts existing CSV files to the format expected by dataset_manager.py
"""
import pandas as pd
from pathlib import Path

def clean_price_column(price_str):
    """Remove dollar signs and convert to float"""
    if isinstance(price_str, str):
        return float(price_str.replace('$', '').replace(',', ''))
    return float(price_str)

def fix_dataset(csv_file):
    """Fix a single CSV file"""
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file)
        
        print(f"Fixing {csv_file.name}")
        print(f"  Original columns: {list(df.columns)}")
        
        # Map columns to standard format
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'date' in col_lower:
                column_mapping[col] = 'date'
            elif 'close' in col_lower or 'last' in col_lower:
                column_mapping[col] = 'close'
            elif 'open' in col_lower:
                column_mapping[col] = 'open'
            elif 'high' in col_lower:
                column_mapping[col] = 'high'
            elif 'low' in col_lower:
                column_mapping[col] = 'low'
            elif 'volume' in col_lower:
                column_mapping[col] = 'volume'
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        
        # Ensure we have required columns
        required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"  Adding missing columns: {missing_columns}")
            for col in missing_columns:
                if col in ['open', 'high', 'low']:
                    df[col] = df['close']  # Use close price as approximation
                elif col == 'volume':
                    df[col] = 1000000  # Default volume
        
        # Clean price columns (remove $ signs)
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            if col in df.columns:
                df[col] = df[col].apply(clean_price_column)
        
        # Clean volume column
        if 'volume' in df.columns:
            df['volume'] = df['volume'].astype(str).str.replace(',', '').astype(int)
        
        # Convert date to proper format
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        # Select and reorder columns
        df = df[required_columns]
        
        # Remove any rows with invalid data
        df = df.dropna()
        df = df[df['close'] > 0]
        
        print(f"  Final shape: {df.shape}")
        print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"  Price range: ${df['close'].min():.2f} to ${df['close'].max():.2f}")
        
        # Save back to the same file
        df.to_csv(csv_file, index=False)
        print(f"Fixed {csv_file.name}\n")
        
        return True
        
    except Exception as e:
        print(f"Error fixing {csv_file.name}: {e}\n")
        return False

def main():
    """Fix all CSV files in the datasets directory"""
    print("Fixing Dataset Format")
    print("=" * 30)
    
    datasets_dir = Path("data/historical_datasets")
    csv_files = list(datasets_dir.glob("*.csv"))
    
    print(f"Found {len(csv_files)} CSV files to fix")
    
    successful = 0
    for csv_file in csv_files:
        if fix_dataset(csv_file):
            successful += 1
    
    print(f"Fixed {successful}/{len(csv_files)} files successfully")

if __name__ == "__main__":
    main()