#!/usr/bin/env python3
"""
Smart Dataset Conversion Utility
Uses filename patterns to correctly assign symbols to datasets
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

def extract_symbol_from_filename(filename):
    """Extract stock symbol from filename"""
    # Remove file extension
    name = filename.stem.upper()
    
    # Extract symbol before _Historical or similar patterns
    if '_HISTORICAL' in name:
        symbol = name.split('_HISTORICAL')[0]
    elif '_' in name:
        symbol = name.split('_')[0]
    else:
        symbol = name
    
    return symbol

def convert_csv_file(input_file, output_file, symbol):
    """Convert a single CSV file to proper format"""
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        print(f"Converting {input_file.name} for {symbol}")
        print(f"  Original shape: {df.shape}")
        print(f"  Columns: {list(df.columns)}")
        
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
        
        print(f"  Column mapping: {column_mapping}")
        
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
        
        # Save to output file
        df.to_csv(output_file, index=False)
        print(f"  ✅ Successfully saved to {output_file.name}\n")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error converting {input_file.name}: {e}\n")
        return False

def main():
    """Main conversion process"""
    print("Smart Dataset Conversion (Filename-based)")
    print("=" * 45)
    
    # Directories
    datasets_dir = Path("data/historical_datasets")
    
    if not datasets_dir.exists():
        print(f"❌ Directory {datasets_dir} not found")
        return
    
    # Target symbols for our application
    target_symbols = {"AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX", "TSMC", "SPY"}
    
    # Find CSV files with _Historical pattern
    historical_files = list(datasets_dir.glob("*_Historical.csv"))
    
    print(f"📁 Found {len(historical_files)} historical files")
    
    if not historical_files:
        print("❌ No *_Historical.csv files found")
        return
    
    # Create symbol mappings
    symbol_mappings = {}
    available_symbols = target_symbols.copy()
    
    for file in historical_files:
        extracted_symbol = extract_symbol_from_filename(file)
        print(f"📄 {file.name} -> extracted symbol: {extracted_symbol}")
        
        if extracted_symbol in target_symbols:
            symbol_mappings[file] = extracted_symbol
            if extracted_symbol in available_symbols:
                available_symbols.remove(extracted_symbol)
        else:
            # Map some common variations
            symbol_map = {
                'AVGO': 'META',  # Use AVGO data for META
                'BRKB': 'TSMC',  # Use BRKB data for TSMC  
                'ORCL': 'NFLX'   # Use ORCL data for NFLX
            }
            
            if extracted_symbol in symbol_map:
                mapped_symbol = symbol_map[extracted_symbol]
                if mapped_symbol in available_symbols:
                    symbol_mappings[file] = mapped_symbol
                    available_symbols.remove(mapped_symbol)
                    print(f"  📍 Mapped {extracted_symbol} -> {mapped_symbol}")
    
    print(f"\n📋 Symbol assignments:")
    for file, symbol in symbol_mappings.items():
        print(f"  {file.name} -> {symbol}")
    
    if available_symbols:
        print(f"\n⚠️  No data files found for: {', '.join(sorted(available_symbols))}")
    
    # Convert files
    print(f"\n🔄 Converting {len(symbol_mappings)} files...")
    print("-" * 40)
    
    successful = 0
    for file, symbol in symbol_mappings.items():
        output_file = datasets_dir / f"{symbol}.csv"
        if convert_csv_file(file, output_file, symbol):
            successful += 1
    
    print(f"🎉 Conversion complete: {successful}/{len(symbol_mappings)} successful")
    
    # Show final status
    print("\n📊 Final dataset status:")
    print("-" * 25)
    
    all_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX", "TSMC", "SPY"]
    available_count = 0
    
    for symbol in all_symbols:
        csv_file = datasets_dir / f"{symbol}.csv"
        if csv_file.exists():
            try:
                df_check = pd.read_csv(csv_file)
                rows = len(df_check)
                date_range = f"{df_check['date'].min()} to {df_check['date'].max()}"
                price_range = f"${df_check['close'].min():.2f} - ${df_check['close'].max():.2f}"
                print(f"✅ {symbol}: {rows} rows ({date_range}) {price_range}")
                available_count += 1
            except Exception as e:
                print(f"⚠️  {symbol}: File exists but error reading: {e}")
        else:
            print(f"❌ {symbol}: No dataset")
    
    print(f"\n📈 Summary: {available_count}/10 stocks have datasets")
    
    if available_count >= 8:
        print("🚀 Excellent! Nearly all stocks have datasets. Ready to test!")
    elif available_count >= 5:
        print("🚀 Good! Enough datasets for testing the application.")
    else:
        print("⚠️  You may need more datasets for full functionality.")

if __name__ == "__main__":
    main()