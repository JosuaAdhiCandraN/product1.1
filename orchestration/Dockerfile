FROM python:3.10-slim

WORKDIR /opt/prefect/orchestration

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# Prefect CLI required
RUN pip install prefect

CMD ["prefect", "flow", "run", "-p", "main_flow.py", "-n", "main_flow"]
