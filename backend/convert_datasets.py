#!/usr/bin/env python3
"""
Dataset Conversion Utility
Converts existing CSV files to the proper format expected by DatasetManager
"""
import os
import pandas as pd
from pathlib import Path
import re

def clean_price_column(price_str):
    """Remove dollar signs and convert to float"""
    if isinstance(price_str, str):
        return float(price_str.replace('$', '').replace(',', ''))
    return float(price_str)

def convert_csv_file(input_file, output_file, symbol):
    """Convert a single CSV file to proper format"""
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        print(f"Converting {input_file} for symbol {symbol}")
        print(f"Original columns: {list(df.columns)}")
        print(f"Shape: {df.shape}")
        
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
            print(f"Warning: Missing columns {missing_columns} for {symbol}")
            # Add missing columns with default values if needed
            for col in missing_columns:
                if col in ['open', 'high', 'low']:
                    df[col] = df.get('close', 0)
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
        
        print(f"Converted data shape: {df.shape}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"Price range: ${df['close'].min():.2f} to ${df['close'].max():.2f}")
        
        # Save to output file
        df.to_csv(output_file, index=False)
        print(f"✅ Successfully converted to {output_file}\n")
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting {input_file}: {e}\n")
        return False

def main():
    """Main conversion process"""
    print("Dataset Conversion Utility")
    print("=" * 40)
    
    # Directories
    datasets_dir = Path("data/historical_datasets")
    
    if not datasets_dir.exists():
        print(f"❌ Directory {datasets_dir} not found")
        return
    
    # Get all CSV files
    csv_files = list(datasets_dir.glob("*.csv"))
    
    if not csv_files:
        print(f"❌ No CSV files found in {datasets_dir}")
        return
    
    print(f"Found {len(csv_files)} CSV files")
    
    # Define the 10 stocks we want
    stock_symbols = [
        "AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", 
        "META", "NVDA", "NFLX", "TSMC", "SPY"
    ]
    
    # Interactive assignment of files to symbols
    print("\nFile to Symbol Assignment:")
    print("-" * 30)
    
    assignments = {}
    
    for i, csv_file in enumerate(csv_files[:10]):  # Limit to first 10 files
        print(f"\nFile {i+1}: {csv_file.name}")
        
        # Try to read first few rows to show sample data
        try:
            sample = pd.read_csv(csv_file, nrows=3)
            print("Sample data:")
            print(sample.to_string(index=False))
            
            # Try to guess the symbol based on price range
            if 'Close/Last' in sample.columns:
                prices = sample['Close/Last'].apply(clean_price_column)
                avg_price = prices.mean()
                
                # Simple price-based guessing
                if avg_price > 400:
                    suggested = "NVDA" if "NVDA" in stock_symbols else stock_symbols[0]
                elif avg_price > 300:
                    suggested = "MSFT" if "MSFT" in stock_symbols else stock_symbols[0]
                elif avg_price > 200:
                    suggested = "AAPL" if "AAPL" in stock_symbols else stock_symbols[0]
                else:
                    suggested = stock_symbols[0] if stock_symbols else "UNKNOWN"
                
                print(f"Suggested symbol (based on price ~${avg_price:.2f}): {suggested}")
        
        except Exception as e:
            print(f"Could not read sample: {e}")
            suggested = stock_symbols[0] if stock_symbols else "UNKNOWN"
        
        # Ask user for symbol assignment
        while True:
            available = ", ".join(stock_symbols)
            user_input = input(f"Assign to symbol [{suggested}] (available: {available}): ").strip().upper()
            
            if not user_input:
                user_input = suggested
            
            if user_input in stock_symbols:
                assignments[csv_file] = user_input
                stock_symbols.remove(user_input)  # Remove from available
                print(f"✅ Assigned {csv_file.name} -> {user_input}")
                break
            else:
                print(f"❌ '{user_input}' is not available. Choose from: {available}")
    
    # Convert files
    print(f"\nConverting {len(assignments)} files...")
    print("=" * 40)
    
    successful = 0
    for csv_file, symbol in assignments.items():
        output_file = datasets_dir / f"{symbol}.csv"
        if convert_csv_file(csv_file, output_file, symbol):
            successful += 1
    
    print(f"Conversion complete: {successful}/{len(assignments)} successful")
    
    # Show final status
    print("\nFinal dataset status:")
    print("-" * 20)
    
    all_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX", "TSMC", "SPY"]
    for symbol in all_symbols:
        csv_file = datasets_dir / f"{symbol}.csv"
        if csv_file.exists():
            print(f"✅ {symbol}: Dataset available")
        else:
            print(f"❌ {symbol}: No dataset")

if __name__ == "__main__":
    main()