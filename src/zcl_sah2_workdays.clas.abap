CLASS zcl_sah2_workdays DEFINITION PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    TYPES ty_dates TYPE SORTED TABLE OF d WITH UNIQUE KEY table_line.
    CLASS-METHODS calc
      IMPORTING iv_from        TYPE d
                iv_to          TYPE d
                it_holidays    TYPE ty_dates OPTIONAL
      RETURNING VALUE(rv_days) TYPE i.
ENDCLASS.

CLASS zcl_sah2_workdays IMPLEMENTATION.
  METHOD calc.
    rv_days = -1.
  ENDMETHOD.
ENDCLASS.
